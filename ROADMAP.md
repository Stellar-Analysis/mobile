# Roadmap

This repo doesn't use a separate GitHub Projects board — the roadmap lives directly
on the issue tracker via `phase-N-*` labels, in build order. Each phase is scoped
narrowly enough to ship and verify before the next one starts; issues within a
phase can be picked up in any order.

## Phase 0 — Hardening
*Cross-cutting engineering health: tests, docs, infra.*

**Progress: 1/6 closed**

- [x] #4 Update mobile README.md with new dashboard/nav structure
- [ ] #1 Add unit tests for new dashboard stat-tile components
- [ ] #2 Extend `src/services/storage.ts` offline-cache schema for new dashboard data
- [ ] #3 Profile `DashboardScreen.tsx` performance after adding new panels
- [ ] #5 Reuse existing biometric auth gate for the new Wallet Dashboard screen
- [ ] #6 Audit `src/navigation/__tests__` coverage after nav restructure

## Phase 1 — Analytics-style homepage
*Turn the dashboard home screen into a live analytics surface.*

**Progress: 0/6 closed**

- [ ] #7 Add analytics stat tiles (DAA, tx 24h, volume, Soroban contracts) to `DashboardScreen.tsx`
- [ ] #8 Wire `useDashboardScreen.ts` to the new backend `/api/v1/stats/summary` endpoint
- [ ] #9 Add vs-yesterday delta indicator to dashboard stat tiles
- [ ] #10 De-emphasize search entry point on `DashboardScreen.tsx`, move below stat tiles
- [ ] #11 Add pull-to-refresh for dashboard stat tiles
- [ ] #12 Add offline-cache fallback for dashboard stats via `src/services/storage.ts`

## Phase 2 — Insights layer
*Auto-generated insight callouts wrapping existing pages, backed by the backend's insights endpoints.*

**Progress: 2/8 closed**

- [x] #19 Rename `AnchorsScreen.tsx` title copy to "Anchor Intelligence"
- [x] #20 Rename "Account Lookup" copy to "Wallet Insights" across screens
- [ ] #13 Add insights callout section to `CorridorsScreen.tsx`
- [ ] #14 Add insights callout section to `AnchorsScreen.tsx`
- [ ] #15 Wire insights callouts to backend insights endpoints
- [ ] #16 Create shared `InsightsCallout` component in `src/components`
- [ ] #17 Add loading/error/empty states for `InsightsCallout`
- [ ] #18 Add unit tests for `InsightsCallout`

## Phase 3 — Network / Soroban / Wallet dashboards
*Three new dedicated dashboard screens, each scaffolded then filled in with panels and offline support.*

**Progress: 0/15 closed**

- [ ] #21 Scaffold `NetworkDashboardScreen.tsx` and `useNetworkDashboardScreen.ts` hook
- [ ] #22 Add DAA and transactions-per-day charts to Network Dashboard screen
- [ ] #23 Add payment volume and new accounts panels to Network Dashboard screen
- [ ] #24 Add fee trends panel to Network Dashboard screen
- [ ] #25 Add pull-to-refresh and offline caching for Network Dashboard screen
- [ ] #26 Scaffold `SorobanDashboardScreen.tsx` and hook
- [ ] #27 Add active contracts and contract calls panels to Soroban Dashboard screen
- [ ] #28 Add gas usage panel to Soroban Dashboard screen
- [ ] #29 Add new deployments and top contracts list to Soroban Dashboard screen
- [ ] #30 Add offline caching for Soroban Dashboard screen
- [ ] #31 Scaffold `WalletDashboardScreen.tsx` and hook
- [ ] #32 Add portfolio value and balance history chart to Wallet Dashboard screen
- [ ] #33 Add asset allocation breakdown to Wallet Dashboard screen
- [ ] #34 Add activity calendar view to Wallet Dashboard screen
- [ ] #35 Add largest transfers list and biometric gate to Wallet Dashboard screen

## Phase 4 — Navigation reorg and renaming
*Restructure the tab bar around the new dashboards and ship the renamed information architecture.*

**Progress: 0/6 closed**

- [ ] #36 Restructure `MainNavigator.tsx` tabs: Overview, Assets, Wallets, Soroban, Rankings, Explorer
- [ ] #37 Move raw tx/ledger lookup screens under a new Explorer tab
- [ ] #38 Update screen titles per rename table across `MainNavigator.tsx`
- [ ] #39 Update deep-link routes in `RootNavigator.tsx` to match the new IA
- [ ] #40 Update push-notification deep links for renamed screens
- [ ] #41 Update app store screenshots/copy to reflect the new IA

## Phase 5 — Top Movers (24h)
*A ranked, shareable "what moved today" feature on top of the new backend rankings endpoint.*

**Progress: 0/5 closed**

- [ ] #42 Build `TopMoversCard` component
- [ ] #43 Wire `TopMoversCard` to `/api/v1/rankings/top-movers`
- [ ] #44 Add native share-sheet (Twitter/X) action on `TopMoversCard`
- [ ] #45 Add Top Movers detail screen with full rankings list
- [ ] #46 Add tests for `TopMoversCard`

## Phase 6 — Grant milestone v1
*Public API + docs milestone: the set of user-facing changes tied to the current grant milestone.*

**Progress: 0/4 closed**

- [ ] #47 Add Asset Rankings screen: top assets by holders and volume
- [ ] #48 Add public API status/health indicator to `SettingsScreen.tsx`
- [ ] #49 Update in-app About copy with the new one-sentence positioning pitch
- [ ] #50 Add analytics/telemetry events for new dashboard screens

---

Each phase's issues carry a `phase-N-*` label plus one or more `area-*` labels
(`area-ui`, `area-api`, `area-wallet`, `area-network`, `area-soroban`,
`area-rankings`, `area-assets`, `area-docs`, `area-infra`) for cross-cutting
filtering. See the [issue tracker](https://github.com/Stellar-Analysis/mobile/issues)
for live status — this file is a snapshot, not the source of truth.
