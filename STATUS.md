# Status

## Current State
- Repo bootstrapped on `main`
- V3 archive extracted to `legacy/warwatch-v3/`
- V4 blueprint copied into `docs/reference/`
- Fullstack V4 runtime is implemented: React/Vite public shell, Express API, SQLite seed/bootstrap, operator review queue, ingestion runner, heartbeat report script
- Public shell is now surface-aware: overview loads first, timeline/signals/briefings/operator data load on demand, and heavy map/chart/operator code is split out of the initial bundle
- Live ingestion is active against `BBC Middle East`, `Al Jazeera`, `NPR World`, `Defense News`, `USNI News`, and `USGS Iran Earthquakes`
- Live market ingestion is active against Yahoo Finance for `oil_brent`, `oil_wti`, and `gold_price`
- Feed dedupe and corroboration are live: repeated feed hits now merge into existing events instead of inflating duplicates
- Freshness truth is corrected: top-line overview state stays stale until the actual KPI metrics are live, even when event ingestion is healthy
- Signals surface now renders live market cards and sparklines from canonical metric history instead of only seeded indicator stories
- Daily SITREP refresh now folds in live market movement when current market snapshots exist
- Operator-reviewed top-line metric publishing is live for `total_strikes`, `oil_brent`, `hormuz_daily_cap`, and `iran_casualties_estimate`
- Heartbeat now renders explicit top-line metric values, freshness, source text, and timestamps instead of only aggregate stale-state summaries
- Verification contract is green locally via `npm run verify`

## Current Goal
Hold and extend the first milestone:
- deployable public shell
- canonical SQLite spine
- working API
- working operator review queue
- working ingestion run path
- working heartbeat report path
- trustworthy freshness and corroboration semantics across public and operator surfaces

## Known Constraints
- The workspace started without a repo or runtime; everything is being built from scratch
- `node:sqlite` is viable locally but still emits experimental warnings in Node 22
- Public deployment verification requires `PUBLIC_BASE_URL` to be set
- The initial bundle issue is reduced, but the map chunk is still the largest client asset and remains a performance follow-up
- The operator refresh lane exists, but the remaining stale top-line metrics still need real reviewed updates backed by current evidence
- Several critical review queue items still block promotion of fresher top-line public claims
