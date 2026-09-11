# Stellar Analysis — Architecture

*A detailed architecture reference for the Stellar Analysis system: what each component is responsible for, how data flows between them, and how the whole thing is deployed and secured.*

## 1. Problem and system overview

Stellar is a payments-focused blockchain built for fast, cheap cross-border settlement. Money moves between currencies and jurisdictions through **anchors** (regulated fiat on/off-ramps) and **payment corridors** (a source-asset → destination-asset path). When an anchor degrades or a corridor's success rate drops, there is no ledger-native way to see it — the failure is invisible until a payment gets stuck, and diagnosing it means reading raw XDR off the network.

Stellar Analysis is a purpose-built observability layer on top of that gap. At a high level it:

1. **Ingests** raw Stellar network activity continuously (via Horizon and Soroban RPC).
2. **Computes** derived reliability metrics from that raw activity — corridor success rate, anchor uptime/reliability score, settlement latency.
3. **Serves** those metrics to three different consumers — a web dashboard, a mobile app, and a public API — over both request/response and realtime channels.
4. **Anchors** a subset of that state on-chain via Soroban smart contracts, for the parts where trustlessness matters more than raw throughput (analytics snapshot hashes, escrow, multi-sig, time-locked transfers, governance).

## 2. Component architecture

```
                         ┌───────────────────────┐
                         │     Stellar Network     │
                         │  (Horizon RPC / Soroban) │
                         └────────────┬────────────┘
                                      │ polling + event subscription
                                      ▼
                         ┌───────────────────────────┐
                         │          Backend            │
                         │   Rust · Axum · SQLx        │
                         │                              │
                         │  ingestion → analytics →     │
                         │  alerting → REST/GraphQL/WS  │
                         └────────────┬────────────────┘
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
             ┌───────────────┐ ┌─────────────┐ ┌───────────────┐
             │    Frontend    │ │    Mobile    │ │   Contracts    │
             │    Next.js     │ │React Native  │ │ Soroban (Rust) │
             │  web dashboard │ │  iOS/Android │ │  on-chain state │
             └───────┬────────┘ └──────┬───────┘ └────────────────┘
                     │                 │
                     └────────┬────────┘
                              ▼
                   ┌───────────────────────┐
                   │  Shared TypeScript SDK   │
                   │  HTTP client, retry,     │
                   │  dedup, network context  │
                   └───────────────────────┘
```

**Backend** is the single source of truth for derived state. It's the only component that talks to Horizon/Soroban RPC directly; every other component talks to the backend, never to the chain directly (except contracts, which *are* on-chain).

**Frontend** and **Mobile** are both thin clients over the same API surface, built against the same shared SDK rather than each implementing their own HTTP layer — this keeps request semantics (retry, dedup, network-context switching between testnet/mainnet) consistent across platforms instead of drifting.

**Contracts** are architecturally separate from the request/response system: they don't serve traffic, they hold state that needs to be independently verifiable (snapshot hashes, escrow balances, multi-sig approvals) rather than trusted from a centralized database.

## 3. Backend architecture

Axum-based service, organized around a pipeline rather than a flat set of endpoints:

```
Horizon/RPC ──▶ ingestion ──▶ event_indexer ──▶ analytics ──▶ snapshot ──▶ API layer
                    │                                            │
                    ▼                                            ▼
              distributed_lock                              realtime (WS)
              (coordinates multiple                          broadcasts to
               backend instances)                            subscribed clients
```

- **`event_indexer`** — stores and queries on-chain contract events. Query interface (`EventQuery`) supports filtering by contract id, event type, epoch, ledger range, time range, and verification status, with configurable sort order (`EventOrderBy`). This is the join point between the on-chain contracts and the off-chain analytics pipeline: contract events are the raw input, analytics summaries are the derived output.
- **`network`** — talks to Horizon/Soroban RPC. Wrapped in a **circuit breaker** (via the `failsafe` crate): opens after 5 consecutive failures, stays open 30 seconds before probing recovery, so a degraded upstream RPC endpoint doesn't cascade into backend-wide failure.
- **`snapshot` / `reconciliation` / `replay`** — the realtime-consistency subsystem, detailed in §5.
- **`distributed_lock`** — coordinates work across multiple backend instances (e.g. only one instance should be actively polling a given RPC endpoint at a time), backed by Redis.
- **`observability`** — OpenTelemetry instrumentation, exported to Jaeger.

**Storage**: PostgreSQL in production, SQLite for local development, with Redis for caching, rate limiting, and cross-instance WebSocket pub/sub. Every credential (DB, JWT signing key, encryption key) is fetched from Vault at boot — the process refuses to start on placeholder secret values rather than silently running insecurely (see §7).

## 4. Frontend architecture

Next.js app, server-rendered where it matters (SEO-relevant pages, initial data) and client-rendered for the interactive dashboard surfaces. Structural choices:

- **Route-per-feature** under `src/app/[locale]/`: `dashboard`, `corridors`, `anchors`, `health`, `network`, `liquidity`, `governance`, `rankings`, `prediction`, `wallet`, `trustlines`, `transactions`, `send-payment`, `deposit-withdraw`, `sep6`/`sep10-demo` (protocol demo/testing surfaces), `soroban`, `developer`, `performance`, `settings`. Each route owns its own data-fetching against the shared SDK rather than a global data layer.
- **Code-splitting by capability, not by route**: the heavy visualization stack (`recharts`, `d3-force-3d`, `react-force-graph-2d`, `framer-motion`) is dynamically imported and bundled into dedicated chunks (`charts.js`, `animation.js`) regardless of which route pulls them in, because they're the majority of bundle weight and are reused across many routes. A CI-enforced 500KB-per-asset budget keeps this from regressing silently.
- **PWA layer**: a service worker with an offline fallback route, so the dashboard degrades to a static "you're offline" page rather than a broken app shell when connectivity drops — the mobile app's offline story (§6) is far more sophisticated than the web app's, which is closer to "read-only availability."
- **Security boundary**: CSP and related headers are applied twice — once statically in the Next.js config (covers static/prerendered responses) and once in middleware (covers dynamically rendered responses) — so there's no route that accidentally ships without them.

## 5. Realtime consistency architecture

This is the subsystem that keeps the backend, the web dashboard, and the mobile app agreeing on the current state of corridors/anchors without requiring every client to poll constantly.

```
Backend                                    Clients
┌─────────────────────┐
│ WebSocket server      │◀──── subscribe(channels) ──── frontend / mobile
│ (Redis pub/sub across │
│  backend instances)   │───── corridor_update / ─────▶ frontend / mobile
│                        │      anchor_update /
│                        │      health_alert
└──────────┬─────────────┘
           │ on disconnect / reconnect
           ▼
┌─────────────────────┐
│ Snapshot API          │◀──── GET /api/rpc/snapshot/{type} (fallback read)
│ Reconciliation API    │◀──── POST /api/rpc/reconcile (catch-up since timestamp)
└─────────────────────┘
```

- A client subscribes to specific channels (`corridor:<key>`, `anchor:<id>`) over a full-duplex WebSocket. Updates are pushed as typed JSON messages (`corridor_update`, `anchor_update`, `health_alert`).
- **Cross-instance consistency**: because the backend runs as multiple instances behind a load balancer, a message published on one instance has to reach clients connected to *any* instance — this is what the Redis pub/sub layer is for.
- **Subscription recovery**: on reconnect, the server restores the client's previous channel subscriptions automatically rather than requiring the client to resubscribe from scratch, and sends a `subscription_recovered` confirmation.
- **Staleness as a first-class state, not a failure**: the frontend/mobile track time-since-last-message and flag data as stale past a 30-second threshold, triggering a snapshot-API fallback fetch rather than presenting silently-outdated numbers.
- **Reconciliation** (`POST /api/rpc/reconcile`) is the catch-up path after any gap (reconnect, cold start, long offline period on mobile): a client sends its last-known timestamp and gets back only what changed since then, rather than a full re-fetch.
- **Operating limits**: 100 messages/min per connection, 1,000 concurrent connections per backend instance, 10 connections per IP with a 20-attempts/min rate limit on new connections.

## 6. Mobile offline architecture

The mobile app is architecturally offline-first, not offline-tolerant — it's designed assuming the network will be unavailable some of the time, rather than treating that as an edge case.

```
①  screen mutates data (offline)
        │
        ▼
②  mobile SQLite: sync_queue table
    (row keyed by caller-supplied dedup_key,
     ON CONFLICT DO UPDATE → resets to pending)
        │  on reconnect
        ▼
③  mobile replay loop
        │  POST /queue/replay
        ▼
④  backend QueueProcessor
    - empty dedup_key            → rejected (programmer error)
    - already-processed dedup_key → short-circuits, no re-trigger
    - exceeds max_retries         → resolves Failed (4xx to caller)
        │
        ▼
⑤  domain side-effects applied exactly once
```

- **Local store**: a SQLite database (`mobile/src/services/database.ts`) holds both read-side cache tables (`corridors`, `anchors`, `assets` — each row a JSON payload plus `updated_at`) and the write-side `sync_queue`. Migrations are append-only and tracked in a `schema_version` table so upgrades never require destructive resets.
- **Idempotency contract**: every queued mutation carries a caller-chosen `dedup_key`. Resubmitting the same logical mutation reuses the same key, and the backend guarantees it triggers domain side-effects **at most once** regardless of how many times the client retries — this is what makes "replay everything after reconnecting" safe instead of duplicating writes.
- **Backoff**: failed sync attempts back off exponentially (`delaySec = min(3600, 5 * 6^(attempts-1))`); after 5 attempts a mutation is marked `failed` and surfaced for manual reconciliation rather than retried forever.
- This composes with the circuit breaker in §3: a replay call that hits a degraded backend goes through the same failure-isolation path as any other RPC call.

## 7. Security architecture

- **Identity**: SEP-10 (Stellar's challenge-response auth standard) is the primary auth mechanism, backing both the web and mobile clients. The verification path validates account format, home domain, and memo length; nonces live in Redis with a strict TTL and are consumed atomically to block replay; and verification **fails closed** — if Redis is unreachable, auth fails rather than silently allowing an unverifiable challenge through.
- **Secrets**: HashiCorp Vault is the single source for credentials. Static secrets (API keys, config) come from Vault's KV v2 engine; database credentials are dynamic, leased, and auto-renewed rather than long-lived static passwords. Secrets rotate on a 90-day cycle, and in Kubernetes they're injected via a Vault Agent sidecar rather than baked into pod specs or env vars at build time. The backend process treats missing/placeholder secrets as a fatal boot error, not a soft warning.
- **Transport-level hardening**: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a restrictive `Permissions-Policy` are applied to every frontend response.
- **Resilience as a security property**: the circuit breaker (§3) and the fail-closed auth design both exist to make degraded-dependency states fail safely rather than fail open.

## 8. Smart contract architecture

A Cargo workspace of Soroban contracts, each with a narrow responsibility and an explicit invariant it must never violate:

| Contract | Responsibility | Invariant |
|---|---|---|
| `stellar_analysis` | Core protocol contract — records analytics-snapshot hashes on-chain | Submissions are authorised, epochs strictly monotonic, no mutation while paused |
| `analytics` | Batched snapshot ingestion with rate limiting and diffing | Snapshot epochs strictly monotonic; an accepted snapshot can't be replaced by an older one |
| `access-control` | Role/permission control shared across contracts | Only an authorised admin changes roles or pause state; role membership is idempotent |
| `escrow` | Holds and releases funds between two parties | Reaches exactly one terminal state; funds can't be released to both parties |
| `governance` / `governance-voting` | Proposal creation, weighted voting, tallying | Executes only after quorum + the voting period; one vote per voter; finalisation is immutable |
| `multi-sig-wallet` | Configurable-threshold multisig | Executes a transaction at most once, never below the configured threshold |
| `time-locked-transactions` | Scheduled transfers | Can't release before unlock time; one terminal state |
| `token-swap` | On-chain offer creation/settlement | Filled or cancelled at most once; atomic, respects quoted amounts |
| `upgrade` | Governance-gated contract upgrades | Only approved upgrades change the active code/version; one final outcome per proposal |

Every deployable crate carries a property/fuzz test suite (`tests/properties.rs`) that exercises its invariant directly — numeric boundaries, call-order permutations — plus `cargo-fuzz` targets for anything that parses attacker-controlled input. This is architecturally deliberate: correctness here is enforced by property tests against a stated invariant, not by example-based unit tests alone, because the failure mode (a violated financial invariant on-chain) is unrecoverable in a way an off-chain bug usually isn't.

## 9. Data architecture

| Store | Used by | Holds |
|---|---|---|
| PostgreSQL | Backend (production) | Canonical corridor/anchor metrics, ingestion state, alert rules/history |
| SQLite | Backend (local dev) | Same schema as Postgres, for zero-dependency local development |
| Redis | Backend | WebSocket pub/sub across instances, rate-limit counters, caching, distributed locks |
| SQLite | Mobile app | Read-cache of corridors/anchors/assets, plus the offline `sync_queue` |
| Soroban ledger state | Contracts | Snapshot hashes, escrow balances, multi-sig approvals, governance votes — the subset of state where on-chain verifiability matters more than query flexibility |

The backend's Postgres/SQLite instance is the operational source of truth for *serving* data (fast to query, flexible to index); the Soroban contracts are the source of truth for *verifying* a narrow slice of that data independently of the backend operator's honesty.

## 10. Deployment architecture

```
                    ┌─────────────┐        ┌──────────────────────┐
                    │   Vercel     │        │      Kubernetes        │
                    │ (frontend,   │   or   │ (self-hosted frontend, │
                    │  primary)    │        │  backend, db, redis)   │
                    └─────────────┘        └──────────────────────┘
                                                       │
                                            ┌──────────┴──────────┐
                                            │  k8s/monitoring/      │
                                            │  Prometheus, Alert-   │
                                            │  manager, ELK, Grafana│
                                            └───────────────────────┘
```

- **Frontend**: primarily deployed to Vercel; a parallel self-hosted path exists via `k8s/frontend/` (Deployment, HPA, PodDisruptionBudget, Service) for anyone not using Vercel.
- **Backend**: `k8s/backend/` — same shape (Deployment, HPA, PDB, Service), stateless so it scales horizontally behind the shared Redis/Postgres.
- **Stateful services**: `k8s/database/` (Postgres as a StatefulSet) and `k8s/redis/`.
- **Networking**: `k8s/ingress/` plus a `k8s/network-policy.yaml` restricting pod-to-pod traffic to what's actually needed.
- **Cloud infrastructure** is provisioned via Terraform (`terraform/global/`): ECR for container images, S3, DynamoDB (Terraform state locking), and IAM — this is AWS-targeted infrastructure-as-code sitting underneath the Kubernetes layer.
- **Observability stack**: Prometheus + Alertmanager for metrics/alerting, an ELK stack for logs, OpenTelemetry/Jaeger for traces, and a pre-built Grafana dashboard — all deployed as part of the same Kubernetes manifests as the application (`k8s/monitoring/`), not bolted on separately.

## 11. Cross-cutting design principles

A few decisions recur across every layer above, worth naming explicitly since they explain *why* the system is shaped this way:

1. **Idempotency over locking.** The mobile sync queue, the backend's replay processor, and the analytics snapshot epoch check all use the same pattern: a caller-supplied idempotency key plus "already processed → no-op" semantics, rather than distributed locks. This is what makes "just retry it" a safe default everywhere in the system instead of a source of duplicate side effects.
2. **Fail closed, not open.** SEP-10 auth failing when Redis is down, the backend refusing to boot on placeholder secrets, and the circuit breaker blocking calls to a degraded RPC endpoint are all the same underlying stance: an uncertain state is treated as unsafe, never as "probably fine."
3. **Staleness is visible, not hidden.** Both the realtime pipeline (30-second staleness threshold) and the mobile offline queue (explicit `pending`/`failed` states surfaced to the user) treat "we don't have current data" as a state to display, not a state to paper over with the last-known values.
4. **One client library, many clients.** The shared TypeScript SDK exists specifically so that retry behavior, request deduplication, and network-context (testnet/mainnet) switching are implemented once and used identically by the web dashboard and the mobile app, rather than reimplemented per platform and drifting apart.
