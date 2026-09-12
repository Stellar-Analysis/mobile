# Wave Program — Maintainer Application

## Repos selected

- `frontend` — web dashboard
- `backend` — API and data/indexing layer
- `contracts` — Soroban smart contracts

## Repo relationship

These three repos form one system, layered from the chain up to the user:

**`contracts`** is the source of truth. Soroban contracts on Stellar record the on-chain state — anchor registration, settlement records, upgrade authorization — that the rest of the system reads from and reports on.

**`backend`** sits in the middle. It ingests ledger data (checkpointed, reorg-aware ingestion), reconciles it against expected state, and computes the derived analytics — corridor health, liquidity, settlement latency percentiles, payment reliability — that no single contract call can answer on its own. It exposes this over a REST API and a WebSocket fanout for real-time updates, and it's the only one of the three that talks directly to both the chain and a database.

**`frontend`** is the client. It has no chain or database access of its own — it renders the backend's REST/WebSocket data as the live "Terminal" dashboard (corridors, anchors, liquidity charts, settlement speed, alerts). It's a pure consumer: everything it displays is either a direct pass-through of backend data or a client-side interaction (alert rules, preferences) that calls back into the backend API.

So the dependency direction is fixed: `contracts` → `backend` → `frontend`. A change to a contract's event shape or method signature is a backend concern before it's ever a frontend concern; a new metric usually means new backend computation before there's anything for the frontend to show. Issues that span more than one repo (e.g. "expose new corridor metric") should be scoped so the backend piece and the frontend piece can be picked up as separate, sequential issues rather than one contributor needing full-stack context.

## Types of work I'd post

**Bug fixes** — the most common category, and usually the most tightly scoped, e.g.:
- Contract-level: upgrade scope invariants, anti-redirection verification on privileged calls
- Backend-level: reconciliation jobs not recovering from transient errors, head-of-line blocking in the realtime fanout under load, distributed lock correctness across replicas
- Frontend-level: hydration mismatches, a connection-status indicator not reflecting real state, chart data lifecycle bugs

**New features** — usually backend- or contract-first, with a follow-up frontend issue once the data exists to display:
- New analytics (e.g. a payment reliability or latency-percentile engine)
- New ledger-ingestion capabilities (checkpointing, reorg handling)
- New contract operations, with the associated invariant/authorization design spelled out as acceptance criteria
- New dashboard views or visualizations once backend support lands

**Documentation** — architecture references, API/event documentation, and onboarding docs that let a contributor pick up a scoped issue without needing a full walkthrough first. Kept factual and current rather than aspirational, since stale docs cost more contributor time than none.

**Testing** — unit and integration coverage for contract invariants (`cargo test`), backend integration tests around ingestion/reconciliation/locking edge cases, and frontend component/accessibility tests. Issues here are deliberately small and self-contained — good first issues for new contributors.

**Performance & security** — query/latency optimization in the backend, footprint- and budget-aware scheduling for contract operations, and security-invariant audits (especially anything touching contract upgrade paths), posted as their own scoped issues rather than folded into feature work.

Each issue is scoped to one repo and one deliverable wherever possible, so a contributor can pick it up during a sprint cycle, understand the acceptance criteria without cross-repo spelunking, and ship it independently.
