# CODEX State

## Repo Lane
Primary repo: `C:\Codex Projects\Iran War`

## Source of Truth
- V3 reference build: `legacy/warwatch-v3/`
- Product blueprint: `docs/reference/WARWATCH-V4-BLUEPRINT.md`
- Runtime/data truth: SQLite DB plus API
- Heartbeat artifact: `reports/heartbeat/LATEST.md`

## Verification Contract
- Integrity: docs + schema + route surface + legacy reference availability
- Typecheck: TypeScript across client, server, shared, scripts
- Test: review gating and API smoke-level behavior
- Build: Vite client + bundled server
- Smoke: built server plus core routes
- Public verify: optional live URL check via `PUBLIC_BASE_URL`

## Implemented Runtime
- Public API routes: overview, events, event detail, metric history, briefings, map layers, stories, sources, graph snapshot, entity dossier
- Operator API routes: review queue, approve/reject actions, ingestion runs, manual ingest trigger
- Seed path: legacy V3 bundle plus blueprint-derived launch briefing and review backlog
- Reporting path: heartbeat script writes a reviewable markdown artifact
- Client runtime is surface-aware and split by lane:
  - snapshot surface now acts as the public/demo-first entry lane
  - command shell lazy-loads heavy map/chart code
  - timeline surface now exposes filters, event inspection, corroboration, and public posture directly in the UI
  - timeline events can now hand readers into matched source posture when the source ledger has a canonical match
  - timeline events can now also hand readers into matched actor dossiers when the graph has a canonical entity match
  - dossiers surface now exposes the actor/claim/relationship graph as a public reader lane instead of leaving the graph buried in SQLite
  - story and briefing lanes now provide selection-aware reader depth instead of static text dumps
  - story strips and briefing readers can now also hand into matched actor dossiers, so the graph is reachable from fronts, signals, and SITREP context
  - briefing references can now hand readers into matched timeline events instead of ending at raw citation text
  - signals now includes a selection-aware source reader tied to canonical stories and source posture
  - operator console is separated from the public bundle
  - timeline, signals, and briefings fetch only the data they need
- Overview freshness is derived from top-line KPI freshness, not just latest event activity
- RSS/event ingestion now dedupes by normalized title/category/date window and upgrades corroboration/source refs on merge
- RSS/event ingestion now also applies a mission-scope firewall so obviously off-scope general-feed items are skipped or quarantined instead of leaking into public surfaces
- Market ingestion now writes canonical metric snapshots for Brent, WTI, and gold from Yahoo Finance
- Signals surface renders live market history directly from the canonical metric store
- Daily SITREP generation refreshes the same-day briefing and includes market movement when live snapshots exist
- Operator API exposes reviewed top-line metric publishing for the public KPI lane
- Operator API also exposes evidence-backed top-line suggestions derived from recent event context
- Operator API now exposes aggregate review-queue SLA summary data for backlog pressure and aging
- Operator API now also exposes a selection-aware review dossier for each queue item, including canonical object detail, feed/link metadata, related evidence events, and superseding briefing context
- Aggregate stale-state logic can now clear through a mix of live/ingested and `operator_reviewed` top-line metrics
- Heartbeat artifact includes explicit top-line metric rows plus queue-aging summary in addition to aggregate freshness state
- Build output now isolates React, chart, and MapLibre vendor lanes, with MapLibre kept off the initial shell through dynamic import
- Preview proof now exists as a repo script: `npm run preview:shots` captures desktop/mobile screenshots from the built app and writes `reports/previews/LATEST.md`
- Preview proof also emits `reports/previews/latest/preview-board.png`, a single stitched board artifact for human-facing updates
- Preview proof now includes the Snapshot surface as the primary visual/demo lane
- Preview proof now also includes the upgraded timeline surface so exploration depth is visible in each artifact pass
- Preview proof now also includes the briefing reader surface so archive usability is visible in each artifact pass
- Preview proof now also validates the cross-surface handoff lane by keeping timeline, signals, and briefing readers in the same artifact set
- Preview proof now also includes the dossiers surface and focused dossier detail so graph progress is visible in each artifact pass

## Operating Assumption
Twice-daily COO heartbeat remains the default cadence unless the repo contract changes.

## Live Feed Lane
- `BBC Middle East`
- `Al Jazeera`
- `NPR World`
- `Defense News`
- `USNI News`
- `USGS Iran Earthquakes`

## Current Truth
- Ingestion is healthy on the current default feed set
- The live feed lane is now materially cleaner: obvious sports, tourism, and unrelated global stories from broad RSS feeds are quarantined away from public surfaces
- Public stale state remains expected because only the market lane is live; strike, Hormuz, and casualty top-line metrics are still bootstrap-era values labeled `stale_seed`
- The operator console can now surface current evidence for stale KPIs, but it will not invent values where extraction is not defensible
- The operator console can now see queue pressure directly through age buckets and SLA summary cards, which gives the COO lane a concrete review-backlog surface
- The operator console can now turn a queue row into a real review packet and jump straight into timeline evidence from the operator lane
- The COO lane can now attach actual UI evidence to updates through local preview screenshots instead of relying only on text artifacts
- Public reader surfaces no longer dead-end as quickly: briefing refs can jump into timeline detail, timeline detail can jump into source posture, and actor-matched events, stories, and briefings can jump into dossier graph detail
- Scope gating is still heuristic and rules-based, so borderline regional-spillover judgments remain a tuning lane rather than a solved problem
- Critical claims continue to require operator approval before promotion to primary public surfaces
