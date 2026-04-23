# Next Steps

## Current Autonomous Order
1. Continue tranche-3 hardening by improving structured extraction and safer canonical update rules now that the public KPI lane is narrowed to `review_hold` rather than `stale_seed`.
2. Land a real deployment target, set `PUBLIC_BASE_URL`, and stop skipping live public verification so the website can move from strong local alpha to actual public surface.
3. Keep operator auth production-safe by treating `OPERATOR_API_KEY` as mandatory once a public URL or production mode exists.
4. Use the build artifact lane to drive MapLibre/vendor reduction, then keep pushing tranche-5 mobile density so the website homepage reaches payload faster on phones.
5. Extend preview proof from the new local atlas entrypoint to deploy-aware and diff-aware artifacts.
6. Return to the KPI lane only when evidence supports real current publications beyond the new reviewed holds.

## External Boundaries
- Deployment work that needs provider configuration or secrets
- Live public verification until `PUBLIC_BASE_URL` exists
- Publication decisions that require defensible current evidence or explicit review

## Explicit Depriorities
- broader source expansion before synthesis quality improves
- delivery/notification features before deployment and operator auth exist
- map animation polish before the current map bundle cost is reduced
