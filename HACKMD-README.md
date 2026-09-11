# Stellar Analysis — Technical Documentation

*A detailed reference for the `Stellar-Analysis` GitHub org: what it builds, how the pieces fit together, and how to work in any of its repos. Written from the actual code and in-repo docs, not marketing copy.*

---

## Table of contents

1. [What this org builds](#1-what-this-org-builds)
2. [Naming history: Stellar Insights vs Stellar Analysis](#2-naming-history-stellar-insights-vs-stellar-analysis)
3. [Repository map](#3-repository-map)
4. [System architecture](#4-system-architecture)
5. [Backend (Rust)](#5-backend-rust)
6. [Frontend (Next.js dashboard)](#6-frontend-nextjs-dashboard)
7. [Mobile (React Native)](#7-mobile-react-native)
8. [TypeScript SDK](#8-typescript-sdk)
9. [Soroban smart contracts](#9-soroban-smart-contracts)
10. [Realtime analytics pipeline](#10-realtime-analytics-pipeline)
11. [Offline sync & local persistence](#11-offline-sync--local-persistence)
12. [Public API surface](#12-public-api-surface)
13. [Security model](#13-security-model)
14. [Secrets management (Vault)](#14-secrets-management-vault)
15. [Infrastructure & deployment](#15-infrastructure--deployment)
16. [Observability](#16-observability)
17. [Local development](#17-local-development)
18. [Known inconsistencies & technical debt](#18-known-inconsistencies--technical-debt)

---

## 1. What this org builds

Stellar is a payments-focused blockchain built for fast, cheap cross-border settlement. Fiat enters and exits the network through **anchors** — regulated on/off-ramps — and moves between currencies through **payment corridors**. When an anchor degrades or a corridor's success rate drops, there is normally no equivalent of a status page: the failure is invisible until money gets stuck, and diagnosing it means reading raw XDR off the ledger.

Stellar Analysis is that missing observability layer. Concretely, the stack:

- **Ingests** Stellar network activity in real time (via Horizon/RPC).
- **Computes** corridor success rates, anchor uptime/reliability scores, and settlement latency.
- **Serves** those metrics through a web dashboard, a mobile app, and a public HTTP/WebSocket API.
- **Anchors** selected state on-chain (via Soroban contracts) where trustlessness matters more than convenience — escrow, multi-sig, time-locked transfers, and the analytics snapshots themselves.

## 2. Naming history: Stellar Insights vs Stellar Analysis

Three names appear across the codebase and it's worth being explicit about which is current:

- **Stellar Insights** is the product/project name. It shows up as the `package.json` name (`"name": "stellar-insights"`), the Rust crate names (`stellar_insights_backend`), the Postgres database name (`stellar_insights`), the mobile SQLite file (`stellar_insights.db`), and throughout in-repo prose.
- **Stellar Analysis** is the current GitHub org. It hosts `frontend`, `backend`, `mobile`, `contracts`, and `.github`.
- **`Stellar-Insightss`** (double s) and **`Stellar-inights`** (missing a letter) are an **older org and repo name** that the project was renamed from. The org profile (`.github` repo) and several in-repo doc links still point at `github.com/Stellar-Insightss/...` — those are stale. If a README link 404s, this is almost always why; treat `Stellar-Analysis` as the canonical org and `frontend` as the canonical core repo going forward.

## 3. Repository map

| Repo | Language | Role |
|---|---|---|
| [`frontend`](https://github.com/Stellar-Analysis/frontend) | TypeScript (+ Rust, Terraform) | The historical monorepo. Despite the name, it contains `frontend/`, `backend/`, `contracts/`, `sdk/`, `docs/`, `k8s/`, `terraform/`, and `elk/` as subfolders — see [§18](#18-known-inconsistencies--technical-debt) for why that's confusing. |
| [`backend`](https://github.com/Stellar-Analysis/backend) | Rust | Standalone extraction of the analytics engine. |
| [`mobile`](https://github.com/Stellar-Analysis/mobile) | TypeScript (React Native) | Standalone mobile app repo. |
| [`contracts`](https://github.com/Stellar-Analysis/contracts) | Rust (Soroban) | Standalone Soroban contract workspace — documented as the source of truth (see [§9](#9-soroban-smart-contracts) and [§18](#18-known-inconsistencies--technical-debt)). |
| [`.github`](https://github.com/Stellar-Analysis/.github) | — | Org profile page. |

The `contracts` and `backend` split-outs mean **some code physically exists in two places**: once inside `frontend/backend` and `frontend/contracts` (monorepo subfolders), and once in the standalone `backend` and `contracts` repos. In-repo docs (`docs/contract-invariants.md`) explicitly say the contracts should live *only* in the standalone repo and that a CI workflow (`.github/workflows/contract-fuzzing.yml`) exists specifically to fail the build if a `contracts/` directory reappears in the monorepo — yet a `contracts/` directory is present and actively tracked in `frontend` as of this writing (last touched by commit `8cc7424a`, "organize root-level files into their documented folders"). Don't assume the two copies are in sync; check which one CI/deploys actually build from before editing contract code.

## 4. System architecture

```
                         ┌─────────────────────┐
                         │   Stellar Network    │
                         │ (Horizon / Soroban)  │
                         └──────────┬───────────┘
                                    │ RPC / Horizon polling
                                    ▼
                         ┌─────────────────────┐
                         │       backend         │
                         │  Rust · Axum · SQLx   │
                         │  ingestion · alerting │
                         │  REST/GraphQL/WS API  │
                         └──────────┬───────────┘
                     ┌──────────────┼──────────────┐
                     ▼              ▼              ▼
             ┌───────────┐  ┌─────────────┐  ┌───────────┐
             │ frontend  │  │   mobile    │  │ contracts │
             │  Next.js  │  │React Native │  │  Soroban  │
             │ dashboard │  │  SEP-10 auth│  │  on-chain │
             └───────────┘  └─────────────┘  └───────────┘
                     ▲              ▲
                     └──────┬───────┘
                            │
                 ┌──────────────────────┐
                 │ @stellar-insights/sdk│
                 │ TypeScript, shared   │
                 │ API client           │
                 └──────────────────────┘
```

A design document in `docs/architecture/ARCHITECTURE_ISSUES_AND_RECOMMENDATIONS.md` records the original planning rationale for this shape: before the mobile app existed, the frontend was tightly coupled to Next.js SSR with API-client logic embedded directly in it, which made a second client (mobile) impossible without duplicating everything. The proposed fix — extract a platform-agnostic `@stellar-insights/sdk`, inject network context (testnet/mainnet) via an `X-Stellar-Network` header rather than a build-time env var, and build the mobile app against the SDK — matches what exists today: the `sdk/typescript` package now holds the shared API client, retry/backoff, request deduplication, and React Native compatibility layers, and both `frontend` and `mobile` consume it rather than each rolling their own HTTP client.

## 5. Backend (Rust)

Axum-based service. Top-level modules (`backend/src/`): `contract_ops`, `distributed_lock`, `event_indexer`, `network`, `observability`, `realtime`, `reconciliation`, `replay`, `snapshot`.

Notable pieces documented in `docs/backend-modules.md`:

- **Event Indexer** — stores and queries on-chain contract events with a flexible `EventQuery` (filter by contract id, event type, epoch, ledger range, time range, verification status; sortable via `EventOrderBy`).
- **Circuit Breaker** — wraps outbound RPC calls (via the `failsafe` crate) with a closed → open → half-open state machine. Defaults: opens after 5 consecutive failures, stays open 30 seconds before probing recovery.
- **Vault module** — see [§14](#14-secrets-management-vault).

Data store: PostgreSQL in production, SQLite for local dev (`DATABASE_URL=sqlite:./stellar_insights.db`). Redis is used for caching, rate limiting, and cross-instance WebSocket pub/sub. The backend refuses to boot with placeholder values for `JWT_SECRET`, `ENCRYPTION_KEY`, or `SEP10_SERVER_PUBLIC_KEY`.

## 6. Frontend (Next.js dashboard)

Package name `stellar-insights`, living at `frontend/frontend` inside the monorepo (or standalone as its own checkout of `frontend/`). Next.js 16, React 19, Tailwind 4, pnpm-managed, deployed to Vercel.

The route surface under `src/app/[locale]/` gives the clearest picture of the product's actual feature set: `dashboard`, `corridors`, `anchors`, `health`, `network`, `liquidity`, `liquidity-pools`, `governance`, `rankings`, `prediction`, `calculator`, `send-payment`, `deposit-withdraw`, `wallet`, `trustlines`, `transactions`, `sep6`, `sep10-demo`, `soroban`, `developer`, `performance`, `quests`, `settings`, `about`, `contact`, `how-to-use`. There's also a top-level (non-localized) `api-docs` playground and an `alerts` page.

Engineering details worth knowing:
- PWA-enabled (`@ducanh2912/next-pwa`) with an `/offline` fallback page.
- Heavy visualization libraries (`recharts`, `d3-force-3d`, `react-force-graph-2d`, `framer-motion`) are dynamically imported and split into separate webpack chunks (`charts.js`, `animation.js`) to keep the initial bundle small, with a 500KB-per-asset performance budget enforced in CI.
- `next-intl` for i18n, Sentry for error tracking, Prisma as the DB client, strict CSP + security headers applied via `next.config.ts` and mirrored at runtime in `src/middleware.ts`.
- Ships `output: 'standalone'` in its Next config — a self-hosted-Node deployment mode, not appropriate for Vercel (see the earlier debugging conversation in this session: this setting caused the production Vercel deployment to 404 on every route despite a "successful" build, because Vercel's own output tracing conflicts with a manually-produced standalone bundle when there's no Dockerfile actually consuming it).

## 7. Mobile (React Native)

Cross-platform iOS/Android app, TypeScript, built for anchors and corridor monitoring on the go.

- **Auth**: SEP-10 (Stellar's challenge-response identity standard), plus biometric auth and platform keychain/keystore token storage.
- **State**: Zustand for local UI state, React Query for server state (mirrors the frontend's pattern, per the SDK-sharing goal in §4).
- **Networking**: testnet/mainnet switching at runtime via the shared SDK's network-context management, not a build-time flag.
- **Push notifications**: Firebase Cloud Messaging.

`src/features/` contains an unusually large set of native-capability modules — `bluetooth_support`, `nfc_support`, `camera_integration`, `barcode_scanner`, `geofencing`, `biometric`-adjacent features, `ar_features`, `vr_support`, `watch_app`, `wear_os_app`, `widget_support`, and more. These are **not uniformly complete**: some (`bluetooth_support`, `nfc_support`) are fully built — a hook, types, tests, and their own README, ~200 lines each — while others (`watch_app`, `ar_features`) are thin stubs (single-digit to low-double-digit line counts). Don't assume a feature folder existing means the feature works; check for a `__tests__` directory and a README inside it as a quick signal of completeness.

Core screens live under `src/screens/main/`: `CorridorsScreen`, `AnchorsScreen`, `SettingsScreen`.

## 8. TypeScript SDK

`sdk/typescript` is the shared client both `frontend` and `mobile` are meant to consume (per the architecture doc in §4). It provides:

- `api-client.ts` / `http.ts` — the core HTTP client.
- `authentication_module.ts` — auth flow handling.
- `anchors_api_module.ts`, `analytics_api_module.ts` — typed resource clients.
- `network_context_management.ts` — the testnet/mainnet runtime switch.
- `retry_with_backoff.ts`, `request_deduplication.ts`, `request_cancellation.ts` — resilience primitives.
- `react_native_compatibility.ts` — shims so the same client works in RN's JS environment.
- `websocket-manager.ts` — realtime subscription handling (see §10).

Most modules ship a co-located `.test.ts` file.

## 9. Soroban smart contracts

Rust workspace (`cargo build --target wasm32-unknown-unknown --release`, optimized with `opt-level = "z"` and stripped symbols to minimize deployed Wasm size). Gas benchmarks are tracked via Criterion (`docs/GAS_COSTS.md`, `cargo bench --package contract-benches`).

| Crate | Purpose | Core invariant (from `docs/contract-invariants.md`) |
|---|---|---|
| `stellar_insights` | Core protocol contract — submits/stores analytics snapshots on-chain | Submissions are authorised, monotonically ordered, and cannot mutate state while paused |
| `analytics` | Batched snapshot ingestion, rate limiting, diffing, pause/unpause | Snapshot epochs are strictly monotonic; an accepted snapshot cannot be replaced by an older one |
| `access-control` | Shared role/permission control | Only an authorised admin can change roles or pause state; role membership is idempotent |
| `escrow` | Holds/releases funds between parties | Reaches exactly one terminal state; funds cannot be released to both parties |
| `governance` | Proposal creation, vote tallying | Executes only after the voting period, only if quorum + passing rule are met; one vote per voter |
| `governance-voting` | Voter registration, weighted voting | Vote weights counted exactly once; finalisation is immutable after the deadline |
| `multi-sig-wallet` | Configurable-threshold multisig | A transaction executes at most once and never below the configured threshold |
| `time-locked-transactions` | Scheduled transfers | Cannot release before unlock time; one terminal state |
| `token-swap` | On-chain offer creation/settlement | Filled or cancelled at most once; token movement is atomic and respects quoted amounts |
| `upgrade` | Governance-gated contract upgrades | Only approved upgrades change the active code/version; one final outcome per proposal |

Every deployable crate is required to carry a `tests/properties.rs` property/fuzz suite exercising its invariant (numeric boundaries, call-order permutations), with `cargo-fuzz` targets for any parsing of attacker-controlled input. CI runs these plus time-boxed fuzz targets and publishes an LCOV report.

## 10. Realtime analytics pipeline

Documented end-to-end in `docs/realtime-pipeline.md`. Components:

- **Backend WebSocket server** (`backend/src/websocket.rs`, referenced as `realtime` module) — full-duplex connections, Redis-backed pub/sub for cross-instance broadcast, rate limiting, and subscription-state persistence so a client can resume its channel subscriptions after a reconnect.
- **Frontend hooks** (`src/hooks/`) — `useWebSocket` (connection + stale-data detection), `useRealtimeCorridors`, `useRealtimeAnchors`.
- **Mobile fallback** — when the WebSocket is unavailable, the app falls back to the snapshot API (`GET /api/rpc/snapshot/{corridor|anchor|all}`) and shows a "last updated X minutes ago" indicator, retrying the socket in the background.
- **Reconciliation** — `POST /api/rpc/reconcile` accepts a `last_known_timestamp` and returns only what changed since then, used after a reconnect or a long offline period.

Message types are plain JSON with a `type` discriminator: `corridor_update`, `anchor_update`, `health_alert`, `subscribe`, `subscription_confirm`, `subscription_recovered`. Stale-data detection defaults to a 30-second threshold on the frontend. Operational limits: 100 messages/min per connection, 1,000 concurrent connections per backend instance, 10 connections per IP with 20 connection attempts per minute.

## 11. Offline sync & local persistence

Documented in `docs/offline-sync.md` (tracked against issue #93). The mobile app, frontend cache, and backend queue stay consistent through:

1. **Mobile SQLite** (`mobile/src/services/database.ts`, DB file `stellar_insights.db`) — cached read tables (`corridors`, `anchors`, `assets`, each row a JSON payload + `updated_at`), plus a `sync_queue` table for outbound mutations keyed by a caller-supplied `dedup_key`. Migrations are append-only, tracked in a `schema_version` table.
2. **Enqueue semantics** — `enqueueSync(endpoint, method, payload, dedupKey)` uses `ON CONFLICT(dedup_key) DO UPDATE` so re-submitting the same logical mutation resets it to `pending` rather than creating a duplicate. Failures back off exponentially (`delaySec = min(3600, 5 * 6^(attempts-1))`), and after 5 attempts the row is marked `failed` for manual reconciliation.
3. **Backend replay** (`backend/src/queue/replay.rs::QueueProcessor`) — processes each `dedup_key` at most once per process lifetime; an already-processed key short-circuits without re-triggering side effects, and retries beyond `max_retries` resolve as a 4xx `Failed`.

This is the same idempotency pattern (a `dedup_key`/`QueueProcessorHandler` contract) referenced independently in the backend-modules doc's circuit-breaker section — the two subsystems are designed to compose (a replay call can itself go through the circuit breaker).

## 12. Public API surface

Base URL `https://api.stellarinsights.io`, OpenAPI spec at `/api-docs/openapi.json`, interactive Swagger UI at `/swagger-ui`. Auth via Bearer API key or OAuth 2.0 (`/api/oauth/authorize`, `/api/oauth/token`).

| Group | Endpoints |
|---|---|
| Anchors | `GET /api/anchors`, `GET /api/anchors/{id}`, `GET /api/anchors/account/{account}`, `GET /api/anchors/{id}/muxed` |
| Corridors | `GET /api/corridors`, `GET /api/corridors/{source}/{destination}`, `GET /api/corridors/{source}/{destination}/metrics` |
| Price feed | `GET /api/prices`, `GET /api/prices/{asset}`, `POST /api/prices/convert` |
| Cost calculator | `POST /api/cost-calculator/estimate`, `POST /api/cost-calculator/routes` |
| Alerts | `GET/POST /api/alerts/rules`, `PUT/DELETE /api/alerts/rules/{id}`, `GET /api/alerts/history` |
| Webhooks | `POST/GET /api/webhooks`, `DELETE /api/webhooks/{id}`, `POST /api/webhooks/{id}/test` |
| Realtime | `GET /api/rpc/snapshot/{type}`, `POST /api/rpc/reconcile`, WebSocket subscription channel |

Standard REST conventions apply throughout: pagination, rate limiting, and a common error-code format (see `docs/API_DOCUMENTATION.md` for full request/response examples).

## 13. Security model

From `docs/security-hardening.md` and `docs/adr/001-security-hardening-strategy.md`:

- **SEP-10 auth** (`backend/src/auth/sep10_simple.rs`) validates challenge requests for account format, home domain, and memo length (≤28 chars); nonces are stored in Redis with a strict TTL and consumed atomically to prevent replay; verification **fails closed** if Redis is unavailable rather than allowing a bypass; the server cross-checks that the home domain and server key in the challenge match its own configuration.
- **CSP and security headers** are applied both statically (`next.config.ts`) and at runtime (`src/middleware.ts`) on the frontend, so they're present on both static and dynamically-rendered routes.
- **Secrets** are never in code or env files in production — see §14.

## 14. Secrets management (Vault)

HashiCorp Vault is the central secrets store (`docs/SECRETS_MANAGEMENT.md`, `docs/backend-modules.md`). Key properties:

- **Static secrets** (API keys, config) live in Vault's KV v2 engine.
- **Dynamic database credentials** are generated per-lease and auto-renewed by a lease manager — the backend never holds a long-lived DB password.
- **Rotation**: secrets rotate automatically on a 90-day cycle.
- **Kubernetes**: production secrets are injected via a Vault Agent sidecar rather than baked into pod specs.
- Required env vars to talk to Vault: `VAULT_ADDR`, `VAULT_TOKEN`, optional `VAULT_NAMESPACE`, `DB_ROLE` (default `stellar-app`).
- The Vault client composes with the circuit breaker (§5) so secret reads are also protected against cascading Vault outages.

## 15. Infrastructure & deployment

- **Frontend**: deploys to Vercel (see §6 for the `output: 'standalone'` footgun) with a parallel path to self-host via the `k8s/frontend/` manifests (Deployment, HPA, PDB, ServiceAccount, Service) if Vercel isn't the target.
- **Backend**: `k8s/backend/` — same shape (Deployment, HPA, PDB, ServiceAccount, Service).
- **Database & cache**: `k8s/database/` (StatefulSet + Service) and `k8s/redis/`.
- **Ingress & policy**: `k8s/ingress/ingress.yaml`, `k8s/network-policy.yaml`, namespace-scoped via `k8s/namespace.yaml`, composed with `k8s/kustomization.yaml`.
- **Monitoring stack**: `k8s/monitoring/` — Alertmanager config, an ELK-stack manifest, Prometheus rules, and a `ServiceMonitor`.
- **Cloud infra (Terraform)**: `terraform/global/` provisions ECR (container registry), S3, DynamoDB (likely Terraform state locking), and IAM — i.e., this is infra-as-code for AWS. `terraform/scripts/` wraps `bootstrap`, `init-state`, `plan`, `apply`, `destroy` as shell scripts rather than a Makefile.
- **Repo hygiene**: a CI-enforced folder-size guard (`scripts/check_folder_size.sh` + `.github/workflows/enforce-folder-size.yml`) keeps any single folder in the monorepo under 200MB, and large binaries are meant to live in Git LFS rather than history.

## 16. Observability

- **Tracing/metrics**: OpenTelemetry with Jaeger for traces.
- **Logs**: an ELK stack (`elk/elasticsearch`, `elk/logstash`, `elk/filebeat`), also deployed into k8s via `k8s/monitoring/elk-stack.yaml`.
- **Dashboards**: a pre-built Grafana dashboard JSON at `docs/grafana/observability-dashboard.json`.
- **Frontend error tracking**: Sentry, configured separately for client (`sentry.client.config.js`) and server (`sentry.server.config.js`).

## 17. Local development

```bash
# 1. Postgres for the backend
docker run --name stellar-postgres -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=stellar_insights -p 5432:5432 -d postgres:14

# 2. Backend (Rust)
cd backend
cp .env.example .env   # fill in DATABASE_URL, STELLAR_RPC_URL, JWT_SECRET,
                        # ENCRYPTION_KEY, SEP10_SERVER_PUBLIC_KEY — the
                        # server refuses to start on placeholder values
./scripts/migrate.sh
cargo run               # listens on 127.0.0.1:8080 by default

# 3. Frontend (Next.js)
cd frontend
pnpm install
pnpm dev

# 4. Mobile (React Native) — this repo
npm install
cd ios && pod install && cd ..   # iOS only
cp .env.example .env
npm run ios     # or: npm run android

# 5. Contracts (Soroban)
cd contracts
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
```

Manual API smoke tests:
```bash
curl http://localhost:8080/api/rpc/health
curl http://localhost:8080/api/rpc/snapshot/corridor
```

## 18. Known inconsistencies & technical debt

Worth knowing before you start changing things, since none of these are hypothetical — each was directly observed in the repos:

1. **`contracts/` exists in the monorepo despite a doc and a CI guard saying it shouldn't.** `docs/contract-invariants.md` states the contracts repo is split out specifically so the monorepo's CI doesn't test a stale copy, and that `.github/workflows/contract-fuzzing.yml` fails the build if a `contracts/` directory reappears in `frontend`. It has reappeared anyway (commit `8cc7424a`). Verify which copy is actually deployed before trusting either one.
2. **Stale org/repo links throughout.** The `.github` org profile and multiple in-repo docs still link to `github.com/Stellar-Insightss/...` (double-s) and `Stellar-inights` (missing a letter) — the org and core repo were renamed to `Stellar-Analysis`/`frontend` without those links being updated.
3. **`output: 'standalone'` in `next.config.ts` broke the production Vercel deployment.** It's meant for self-hosted Node/Docker deployments; there's no Dockerfile in the repo that consumes it. Removed in commit `db2a9ef1` on `frontend`.
4. **Duplicate keys in `frontend/package.json`** (`dompurify` and `framer-motion` each listed twice with different version ranges) — a merge artifact; the effective (last-wins) versions matched what was already resolved in `pnpm-lock.yaml`, so deduping was safe. Fixed in the same commit as #3.
5. **Two lockfiles committed side-by-side** (`package-lock.json` and `pnpm-lock.yaml`) in `frontend/frontend`, despite `packageManager: "pnpm@..."` being pinned in `package.json`. The npm lockfile was removed as part of the same fix.
6. **`docs/` is not a reliable single source of truth.** It contains a large volume of vendored/generic content unrelated to this project (e.g. the entire upstream Next.js documentation tree, and at least one templated threat-model doc for an unrelated npm package called `resolve`). When citing something from `docs/`, check that the file is actually project-specific (naming like `API_DOCUMENTATION.md`, `contract-invariants.md`, `realtime-pipeline.md`, `SECRETS_MANAGEMENT.md`, `offline-sync.md`, `backend-modules.md`, `security-hardening.md` are trustworthy; generic Next.js API-reference-style filenames are not).
7. **Mobile `src/features/` completeness varies widely.** Some native-capability modules are fully implemented with hooks, types, tests, and a README (`bluetooth_support`, `nfc_support`); others are near-empty scaffolding (`watch_app`, `ar_features`). Don't assume a feature folder's existence means the feature works.
8. **Vercel Deployment Protection (SSO) was left enabled on the `frontend` production project**, and the domain `frontend-topaz-seven-64.vercel.app` (the one listed as the repo's GitHub "homepage") was no longer bound to the current project's deployments at all — the current deployment's real URL is auto-generated and team-scoped. Both are dashboard-only settings (Project → Settings → Deployment Protection / Domains) and were not something fixable via a code change.
