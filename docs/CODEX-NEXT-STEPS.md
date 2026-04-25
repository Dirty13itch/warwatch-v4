# Next Steps

## Current Autonomous Order
1. Keep the live Vercel website honest by refreshing and recommitting `data/public-snapshot.json` whenever the public truth materially changes.
2. Continue tranche-3 hardening so `total_strikes` and `iran_casualties_estimate` can move from `review_hold` to real reviewed current values when evidence supports them, and keep `hormuz_daily_cap` refreshed from defensible throughput evidence instead of dropping back to a synthetic hold.
3. Keep operator auth and write-side workflows local; do not blur the hosted public-readonly lane into a fake mutable backend.
4. Use the build artifact lane to drive MapLibre/vendor reduction, then keep pushing tranche-5 mobile density so the website homepage reaches payload faster on phones.
5. Extend preview proof from the local atlas entrypoint to deploy-aware and diff-aware artifacts.
6. Only revisit paid/persistent hosted infrastructure if the project truly needs live hosted writes, ingestion, or scheduler execution.

## External Boundaries
- The hosted lane is intentionally read-only; live operator writes and scheduler work still require the local mutable runtime
- Vercel Git integration is currently not auto-deploying new commits, so production updates require the explicit CLI deploy path until that drift is fixed
- Local container image proof on this workstation until `docker` exists on PATH
- Publication decisions that require defensible current evidence or explicit review

## Explicit Depriorities
- broader source expansion before synthesis quality improves
- delivery/notification features before the public truth lane improves
- map animation polish before the current map bundle cost is reduced
