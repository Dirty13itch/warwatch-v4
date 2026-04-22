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
1. Use the reviewed KPI control lane and evidence-backed suggestions to replace the remaining seeded strike/Hormuz/casualty top-line values with current snapshots
2. Harden ingestion synthesis: improve merge quality, track corroboration explicitly, and prepare operator-facing claim/story promotion rules
3. Reduce the remaining command-surface performance cost, especially the MapLibre vendor lane
4. Set a real deployment target and enable live public verification through `PUBLIC_BASE_URL`
5. Keep heartbeat, status, and next-step artifacts synchronized with runtime truth after each ingestion/verification slice
6. Use the new queue-aging summary to drive operator backlog triage before critical claims are promoted
7. Refresh local preview artifacts when UI lanes change so COO updates can include concrete visual proof
8. Prefer the single preview-board artifact for human updates, then drill into individual surface shots only when needed
9. Keep the Snapshot surface strong enough to serve as the default public/demo-first lane while command remains the deeper operational shell
