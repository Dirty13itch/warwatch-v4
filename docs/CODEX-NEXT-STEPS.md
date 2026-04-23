# Next Steps

## Current Autonomous Order
1. Create the real Render service from `render.yaml`, attach the persistent disk at `/app/data`, and let the first live deploy establish the real public URL.
2. Set `PUBLIC_BASE_URL` to the actual live URL and stop skipping live public verification now that the website lane has route-aware HTML metadata, sitemap coverage, and deploy-ready packaging.
3. Keep operator auth production-safe by treating `OPERATOR_API_KEY` as mandatory once a public URL or production mode exists.
4. Continue tranche-3 hardening by improving structured extraction and safer canonical update rules so the remaining `review_hold` KPIs can move to real reviewed current publications when evidence supports them.
5. Use the build artifact lane to drive MapLibre/vendor reduction, then keep pushing tranche-5 mobile density so the website homepage reaches payload faster on phones.
6. Extend preview proof from the local atlas entrypoint to deploy-aware and diff-aware artifacts.
7. Return to the KPI lane for publication only when evidence is genuinely defensible, not just because the public site is live.

## External Boundaries
- Render account/tooling work that needs workspace access or provider configuration
- Live public verification until `PUBLIC_BASE_URL` exists
- Local container image proof on this workstation until `docker` exists on PATH
- Publication decisions that require defensible current evidence or explicit review

## Explicit Depriorities
- broader source expansion before synthesis quality improves
- delivery/notification features before deployment and operator auth exist
- map animation polish before the current map bundle cost is reduced
