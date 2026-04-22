# Status

## Current State
- Repo bootstrapped on `main`
- V3 archive extracted to `legacy/warwatch-v3/`
- V4 blueprint copied into `docs/reference/`
- Fullstack V4 runtime is implemented: React/Vite public shell, Express API, SQLite seed/bootstrap, operator review queue, ingestion runner, heartbeat report script
- Verification contract is green locally via `npm run verify`

## Current Goal
Hold and extend the first milestone:
- deployable public shell
- canonical SQLite spine
- working API
- working operator review queue
- working ingestion run path
- working heartbeat report path

## Known Constraints
- The workspace started without a repo or runtime; everything is being built from scratch
- `node:sqlite` is viable locally but still emits experimental warnings in Node 22
- Public deployment verification requires `PUBLIC_BASE_URL` to be set
- The first client bundle is large because MapLibre + charting + operator shell all ship together; code-splitting is a follow-up optimization
