# WarWatch AGENTS

## Repo Truth
- This repo root is the live WarWatch V4 project.
- `legacy/warwatch-v3/` is reference-only. Do not patch legacy files to implement new product behavior.
- Durable operating surfaces live in `PROJECT.md`, `STATUS.md`, `docs/CODEX-STATE.md`, `docs/CODEX-NEXT-STEPS.md`, `.agents/TEAM-ROSTER.md`, and `plans/active/coo-operating-system.md`.
- Runtime truth outranks stale docs. If the app, database, ingestion jobs, or deployment behave differently than the docs say, update the docs to match the live state.

## Product Contract
- WarWatch is a public-facing intelligence shell plus accountability knowledge base.
- Public truth must remain review-gated for critical claims.
- Low-confidence or auto-ingested items may appear only on clearly labeled secondary surfaces until reviewed.
- Preserve the V3 strengths: map, fronts, timeline, analysis, signals, media, and operator utility.
- Preserve mobile usability as a first-order requirement, not a backlog item.

## Execution Rules
- Prefer typed shared models over page-local ad hoc objects.
- Treat ingestion, review queue, public APIs, operator console, and heartbeat reporting as one system.
- Before changing recurring workflows, inspect whether the same need should live in scripts or automation instead of ad hoc chat instructions.
- Verify with the smallest useful proof path. Default repo closeout is `npm run verify`.

## Safe Mutation
- Never destroy legacy source material or overwrite extracted reference files without cause.
- Keep reviewable artifacts explicit: active plan, status docs, release notes, heartbeat report, and DB-backed review queue.
- When deployment or automation is not configured, land the code and the verification hooks anyway; do not silently pretend the lane exists.

