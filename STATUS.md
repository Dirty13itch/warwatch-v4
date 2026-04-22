# Status

## Current State
- Repo bootstrapped on `main`
- V3 archive extracted to `legacy/warwatch-v3/`
- V4 blueprint copied into `docs/reference/`
- Fullstack V4 runtime is implemented: React/Vite public shell, Express API, SQLite seed/bootstrap, operator review queue, ingestion runner, heartbeat report script
- The public shell now opens on a curated `Snapshot` surface that packages posture, SITREP context, fronts, live market signals, and trust framing before the deeper command/operator lanes
- Public shell is now surface-aware: overview loads first, timeline/signals/briefings/operator data load on demand, and heavy map/chart/operator code is split out of the initial bundle
- The timeline is now a real explorer: filterable chronology, selection-aware event detail, corroboration counts, and public-posture context are all visible without leaving the surface
- Story and briefing lanes now have real drill-down: shared story strips expose selection-aware readers, and the briefing archive opens into a structured SITREP reader instead of dumping full text inline
- Canonical handoff is now live across public reader lanes: timeline events can open matched source posture, signals exposes a real source reader, and briefing references can jump into matched timeline events
- Live ingestion is active against `BBC Middle East`, `Al Jazeera`, `NPR World`, `Defense News`, `USNI News`, and `USGS Iran Earthquakes`
- Live market ingestion is active against Yahoo Finance for `oil_brent`, `oil_wti`, and `gold_price`
- Feed dedupe and corroboration are live: repeated feed hits now merge into existing events instead of inflating duplicates
- Freshness truth is corrected: top-line overview state stays stale until the actual KPI metrics are live, even when event ingestion is healthy
- Signals surface now renders live market cards and sparklines from canonical metric history instead of only seeded indicator stories
- Daily SITREP refresh now folds in live market movement when current market snapshots exist
- Operator-reviewed top-line metric publishing is live for `total_strikes`, `oil_brent`, `hormuz_daily_cap`, and `iran_casualties_estimate`
- Operator KPI lane now includes evidence-backed suggestion cards with extracted candidates when current event evidence supports them
- Operator queue aging is now explicit: queue items carry age buckets, the operator console shows backlog pressure cards, and the heartbeat reports pending, critical, >24h, >72h, and oldest-item age
- Operator review is now selection-aware: queue items open into a dossier with canonical object detail, feed/source metadata, recommended next action, superseding briefing context, and related evidence events
- The operator lane can now hand directly into timeline evidence from both KPI suggestion cards and queue dossiers, which makes tranche-1 review work faster and less abstract
- Heartbeat now renders explicit top-line metric values, freshness, source text, and timestamps instead of only aggregate stale-state summaries
- Heartbeat output is sanitized to an ASCII-safe operator artifact so Windows console review does not corrupt high-signal lines
- Visual proof is now first-class: `npm run preview:shots` builds the app, captures desktop/mobile screenshots for the command, signals, and operator lanes, and writes a local artifact to `reports/previews/LATEST.md`
- Preview output now also includes a single `reports/previews/latest/preview-board.png` board artifact so updates can show one readable visual brief instead of a loose image set
- The preview lane now centers the new Snapshot surface, which gives the product a better public/demo-first entry point than dropping directly into the raw command shell
- Visual proof now includes the upgraded timeline surface so public exploration depth is visible in the preview board, not just the landing shell
- Visual proof now includes the briefing reader lane so public archive depth is visible in the preview board as well
- Visual proof now captures the canonical handoff slice, so the timeline, signals, and briefing lanes can be shown as one connected reading flow instead of isolated screens
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
- Client bundle shaping is improved through vendor/manual chunking and lazy map boot, but the MapLibre vendor chunk still breaches the warning threshold and remains a performance follow-up
- Preview screenshots are local workspace artifacts today; once a public deployment exists, the same visual-proof lane should validate the deployed surface as well
- The operator refresh lane now surfaces current evidence, but the remaining stale top-line metrics still need actual reviewed publications to clear the public stale flag
- Several critical review queue items still block promotion of fresher top-line public claims
