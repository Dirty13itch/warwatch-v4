# Active Plan: COO Operating System

## Objective
Run WarWatch as a persistent product program rather than a one-off site rebuild.

## Active Milestone
Phase zero plus first release foundation:
- repo truth surfaces
- V4 app scaffold
- canonical database
- public command center
- operator review console
- ingestion path
- heartbeat reporting

## Acceptance Bar
- `npm run verify` passes locally
- public API routes resolve against DB-backed data
- operator review queue exists and can approve/reject critical items
- heartbeat report script produces a concrete delta artifact
- docs reflect current truth

## Immediate Queue
1. Finish app/runtime scaffold and typed models
2. Seed database from legacy bundle plus curated V4 inputs
3. Land responsive public/operator UI
4. Wire ingestion and review paths
5. Create recurring automation

