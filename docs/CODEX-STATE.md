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

## Operating Assumption
Twice-daily COO heartbeat remains the default cadence unless the repo contract changes.
