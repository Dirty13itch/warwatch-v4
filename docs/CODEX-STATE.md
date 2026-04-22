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
- Public API routes: overview, events, event detail, metric history, briefings, map layers, stories, sources
- Operator API routes: review queue, approve/reject actions, ingestion runs, manual ingest trigger
- Seed path: legacy V3 bundle plus blueprint-derived launch briefing and review backlog
- Reporting path: heartbeat script writes a reviewable markdown artifact
- Client runtime is surface-aware and split by lane:
  - command shell lazy-loads heavy map/chart code
  - operator console is separated from the public bundle
  - timeline, signals, and briefings fetch only the data they need
- Overview freshness is derived from top-line KPI freshness, not just latest event activity
- RSS/event ingestion now dedupes by normalized title/category/date window and upgrades corroboration/source refs on merge
- Market ingestion now writes canonical metric snapshots for Brent, WTI, and gold from Yahoo Finance
- Signals surface renders live market history directly from the canonical metric store
- Daily SITREP generation refreshes the same-day briefing and includes market movement when live snapshots exist
- Operator API exposes reviewed top-line metric publishing for the public KPI lane
- Aggregate stale-state logic can now clear through a mix of live/ingested and `operator_reviewed` top-line metrics
- Heartbeat artifact includes explicit top-line metric rows in addition to aggregate freshness state

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
- Public stale state remains expected because only the market lane is live; strike, Hormuz, and casualty top-line metrics are still bootstrap-era values labeled `stale_seed`
- Critical claims continue to require operator approval before promotion to primary public surfaces
