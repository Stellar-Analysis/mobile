# Stellar Analysis

*A write-up of the org, its repos, and how the pieces fit together — for HackMD.*

## The pitch

Stellar Analysis turns raw Stellar ledger activity into payment-reliability metrics that actually mean something. Cross-border payments on Stellar settle in seconds, but knowing whether a corridor is *healthy* — whether an anchor is up, how long settlement is taking, whether something's degrading — normally means squinting at raw XDR. This org builds the stack that watches the ledger and surfaces that as corridor success rates, anchor uptime, and settlement latency, through a live dashboard, a mobile app, and an on-chain analytics layer.

The underlying project is called **Stellar Insights** — "Stellar Analysis" is the org/brand it ships under. You'll see both names used interchangeably across repos, package names, and docs.

## Repositories

| Repo | Language | What's in it |
|---|---|---|
| [`frontend`](https://github.com/Stellar-Analysis/frontend) | TypeScript | The core repo — a Next.js dashboard plus infra (Docker, k8s, Terraform), docs, and shared tooling. Despite the name, this is effectively the project's monorepo: it contains `frontend/`, `backend/`, `contracts/`, `sdk/`, `docs/`, `k8s/`, `terraform/`, and `elk/` as subfolders. |
| [`backend`](https://github.com/Stellar-Analysis/backend) | Rust | The analytics engine as a standalone repo — ingestion, alerting, caching, REST + GraphQL + WebSocket API. |
| [`mobile`](https://github.com/Stellar-Analysis/mobile) | TypeScript (React Native) | This repo — a cross-platform app for anchors and corridor monitoring on the go. |
| [`contracts`](https://github.com/Stellar-Analysis/contracts) | Rust (Soroban) | On-chain analytics snapshots, escrow, governance, multi-sig, token swap — the trustless layer. |
| [`.github`](https://github.com/Stellar-Analysis/.github) | — | Org profile. |

**Note on history:** the org profile (`.github` repo) and some in-repo links still point at an older org name, `Stellar-Insightss`, and an older core-repo name, `Stellar-inights`. The project has since been renamed/moved to `Stellar-Analysis` — `frontend` is that renamed core repo. If you hit a 404 following an old link from a README, this is why; treat `Stellar-Analysis` as canonical.

## Architecture at a glance

```
                         ┌─────────────────────┐
                         │   Stellar Network    │
                         │ (Horizon / Soroban)  │
                         └──────────┬───────────┘
                                    │ RPC / Horizon
                                    ▼
                         ┌─────────────────────┐
                         │       backend        │
                         │  Rust · Axum · SQLx   │
                         │ ingestion, alerting,  │
                         │  REST/GraphQL/WS API  │
                         └──────────┬───────────┘
                     ┌──────────────┼──────────────┐
                     ▼              ▼              ▼
             ┌───────────┐  ┌─────────────┐  ┌───────────┐
             │ frontend  │  │   mobile    │  │ contracts │
             │  Next.js  │  │React Native │  │  Soroban  │
             │ dashboard │  │  SEP-10 auth│  │  on-chain │
             └───────────┘  └─────────────┘  └───────────┘
```

## Component breakdown

### 🖥️ Frontend — Next.js dashboard
Lives at `frontend/` inside the `frontend` repo. Package name is `stellar-insights`. Highlights from the config:
- Next.js 16, React 19, Tailwind 4, pnpm-managed.
- PWA support (`@ducanh2912/next-pwa`), offline fallback page.
- Chart-heavy: `recharts`, `d3-force-3d`, `react-force-graph-2d` for network/corridor visualizations, code-split into separate bundles to keep initial JS small.
- `next-intl` for i18n, Sentry for error tracking, Prisma as the DB client.
- Strict CSP and security headers applied at the framework level.
- Deploys to Vercel (with a k8s/Terraform path also available for self-hosting).

### ⚙️ Backend — Rust analytics engine
Standalone repo, but the same code also lives inside `frontend/backend/` in the monorepo. Axum-based service that:
- Ingests Stellar network activity via RPC/Horizon.
- Computes corridor and anchor reliability metrics.
- Serves REST, GraphQL, and WebSocket APIs, with Redis-backed caching and rate limiting.
- Uses PostgreSQL in production, SQLite for local dev.
- Expects `JWT_SECRET`, `ENCRYPTION_KEY`, `SEP10_SERVER_PUBLIC_KEY` at startup — refuses to boot on placeholder values.
- Production secrets are meant to come from Vault.

### 📱 Mobile — React Native app (this repo)
- Cross-platform (iOS + Android).
- SEP-10 authentication (Stellar's challenge-response auth standard) for anchor/wallet identity.
- Offline-first, with network switching between testnet and mainnet.
- Biometric auth, push notifications via Firebase Cloud Messaging.
- State management via Zustand, same pattern as the frontend.

### 📜 Contracts — Soroban smart contracts
Rust workspace, one crate per concern:

| Crate | Purpose |
|---|---|
| `stellar_insights` | Core protocol contract — submits and stores analytics snapshots on-chain |
| `analytics` | Batched snapshot ingestion with rate limiting, diffing, pause/unpause |
| `access-control` | Shared role/permission control across contracts |
| `escrow` | Holds and releases funds between parties |
| `governance` / `governance-voting` | Proposal creation, weighted voting, tallying |
| `multi-sig-wallet` | Multi-signature wallet with configurable threshold |
| `time-locked-transactions` | Transfers that unlock at a future ledger time |
| `token-swap` | On-chain offer creation and settlement |
| `upgrade` | Governance-gated contract upgrade proposals |

Built for `wasm32-unknown-unknown` via the Soroban CLI, optimized for minimal deployed Wasm size (`opt-level = "z"`, stripped symbols).

### 🔭 Observability & infra
- OpenTelemetry, Jaeger, and an ELK stack (`elk/`) for logs/traces/metrics.
- Kubernetes manifests (`k8s/`) and Terraform (`terraform/`) for self-hosted deployment of frontend, backend, database, redis, ingress, and monitoring.
- A CI guard (`scripts/check_folder_size.sh` + a GitHub Actions workflow) keeps any single folder in the monorepo under 200MB.

## Local dev quick start

```bash
# 1. Postgres for the backend
docker run --name stellar-postgres -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=stellar_insights -p 5432:5432 -d postgres:14

# 2. Backend (Rust)
cd backend
cp .env.example .env   # fill in DATABASE_URL, STELLAR_RPC_URL, JWT_SECRET, etc.
cargo run

# 3. Frontend (Next.js)
cd frontend
pnpm install
pnpm dev

# 4. Mobile (React Native) — this repo
npm install
cd ios && pod install && cd ..   # iOS only
npm run ios     # or: npm run android
```

## Why this matters (for judges / readers unfamiliar with Stellar)

Stellar is a payments-focused blockchain built for fast, cheap cross-border settlement, with "anchors" (regulated on/off-ramps) bridging fiat and the network. When an anchor goes down or a corridor degrades, the failure mode is invisible until money gets stuck — there's no equivalent of a status page for corridor health today. Stellar Analysis is that status page: a Rust ingestion pipeline reads the ledger in real time, a dashboard and mobile app surface reliability metrics to anchors and integrators, and a set of Soroban contracts make selected analytics and settlement logic (escrow, multi-sig, time-locks) verifiable on-chain rather than trusted blindly off-chain.
