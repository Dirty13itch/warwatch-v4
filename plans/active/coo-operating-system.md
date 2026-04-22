# Active Plan: COO Operating System

## Objective
Run WarWatch as a permanent product program that can keep shipping autonomously in back-to-back slices without falling into backlog sprawl, stale public truth, or verification drift.

## Execution Doctrine
- Always pull the next highest-leverage unblocked slice from the current tranche.
- Finish slices vertically:
  - canonical data or workflow change
  - public/operator surface change if needed
  - proof path
  - preview or heartbeat artifact refresh
  - docs/state sync
  - commit
- Do not pause between slices unless the next move crosses a real boundary:
  - missing deploy target or secret
  - missing `PUBLIC_BASE_URL`
  - evidence is insufficient for safe publication
  - the product contract requires a human review decision

## Acceptance Bar
- `npm run verify` passes locally
- public API routes resolve against DB-backed data
- operator review queue exists and can approve/reject critical items
- heartbeat report script produces a concrete delta artifact
- docs reflect current truth
- preview artifacts stay current when public UI materially changes

## Autonomous Tranche Order

### Tranche 1: Public Truth Unlock
Purpose: clear the top-line stale/public-truth bottleneck so the public shell stops presenting seed-era KPI posture as current.

Primary owner:
- Intelligence QA Lead

Supporting lanes:
- COO / Program Lead
- Product / Editorial Lead
- Platform / Backend Lead

Tasks:
1. Resolve the remaining seeded KPI lane:
   - `total_strikes`
   - `hormuz_daily_cap`
   - `iran_casualties_estimate`
2. Triage the current critical review queue and clear items that block top-line truth:
   - ceasefire status revalidation
   - threat-level banner review
   - first live SITREP refresh
   - current critical external source items
3. Tighten operator suggestion quality where evidence is noisy or missing.
4. Publish defensible reviewed snapshots through the operator lane rather than leaving the public shell in `stale_seed`.
5. Refresh heartbeat and briefing outputs once reviewed truth materially changes.

Exit criteria:
- public stale flag is either cleared or narrowed to an explicitly evidence-bound residual
- current top-line metrics are review-backed instead of seed-backed
- the critical queue no longer blocks the first fully current public SITREP

### Tranche 2: Canonical Intelligence Graph
Purpose: turn the current connected readers into a real explorable knowledge graph instead of a set of linked screens.

Primary owner:
- Platform / Backend Lead

Supporting lanes:
- Frontend Lead
- Data Ingestion Lead
- Product / Editorial Lead

Tasks:
1. Promote entities, claims, and relationships from passive types into active stored/queryable runtime objects.
   Current state: baseline graph snapshot and public dossier surface are now live.
2. Add APIs and selectors for:
   - entities
   - claims
   - relationships
   - story-to-claim and event-to-entity joins
3. Extend handoffs:
   - snapshot to story/entity/claim context
   - timeline to claim/entity context
   - briefings to story/event/entity context
   - signals to source/story/claim context
   Current state: timeline, story strips, briefing readers, snapshot, and source posture can now open into the dossier graph.
4. Add UI drill-down for canonical objects without collapsing the current clean shell.
5. Keep public-safe labeling explicit for disputed or unreviewed nodes.

Exit criteria:
- snapshot, timeline, briefings, and signals all resolve into the same canonical graph
- claims and entities are navigable public/operator objects instead of just future types
- no major reader lane ends in a dead-end chip list

### Tranche 3: Ingestion and Synthesis Hardening
Purpose: improve the quality of what enters the graph so new runtime truth becomes useful faster and with less manual cleanup.

Primary owner:
- Data Ingestion Lead

Supporting lanes:
- Intelligence QA Lead
- Platform / Backend Lead

Tasks:
1. Improve event merge quality beyond title/date heuristics.
2. Strengthen source normalization, mission-scope scoring, and source-to-ledger matching.
   Current state: entity matching is now shared between client and server, event ingestion now persists canonical `entity:*` tags, and a repo script can backfill historical rows onto that same tagging scheme.
3. Add safer synthesis rules for:
   - claim extraction
   - story promotion candidates
   - metric suggestions beyond market data
   Current state: operator top-line suggestions now use entity-aware relevance instead of pure regex matching, which blocks obvious generic-shipping false positives; operator synthesis now also clusters related recent evidence into graph-aware story and claim candidates, can queue them for review, can persist approved promotions into canonical stories/claims through the normal operator gate, and now prunes stale evidence plus splits unrelated high-volume claim topics before promotion.
4. Expand structured extractor coverage for public-truth KPIs.
5. Ensure duplicate suppression, corroboration upgrades, and review-item creation stay idempotent.

Exit criteria:
- feed evidence upgrades existing canonical records more often than it creates noisy new ones
- operator suggestions become more actionable and less manual
- new ingestion lanes can be added with predictable review behavior

### Tranche 4: Release and Runtime Hardening
Purpose: move from locally verified to actually deployable and live-verifiable.

Primary owner:
- SRE / Release Lead

Supporting lanes:
- Platform / Backend Lead
- COO / Program Lead

Tasks:
1. Choose and wire a real deployment target.
2. Set `PUBLIC_BASE_URL` and make live public verification mandatory instead of skipped.
3. Add runtime health checks for:
   - stale ingestion
   - failing jobs
   - public route regressions
   - review queue backlog pressure
4. Harden release proof:
   - CI stays authoritative
   - live smoke is easy to rerun
   - deployment verification is visible in heartbeat/release artifacts
5. Add production-safe operator auth and gated write paths once the deployment lane exists.

Exit criteria:
- the app is deployed somewhere real
- `verify:public` stops skipping
- runtime health and stale-data failures are visible without manual inspection

### Tranche 5: Performance and Demo Polish
Purpose: make the shipped experience lighter, clearer, and easier to show to other people.

Primary owner:
- Frontend Lead

Supporting lanes:
- SRE / Release Lead
- Product / Editorial Lead

Tasks:
1. Reduce the MapLibre vendor burden with deeper isolation or a lighter strategy.
2. Improve mobile layout where dense public surfaces still compress poorly.
3. Add preview diffs and higher-signal visual proof for before/after slices.
4. Tighten accessibility, readability, and interaction clarity.
5. Keep Snapshot strong as the default public/demo lane while command remains the deeper operational surface.

Exit criteria:
- build warnings are reduced or intentionally bounded
- preview artifacts show measurable UI improvement across slices
- public/demo readiness improves without hiding operational depth

### Tranche 6: Expansion and Distribution
Purpose: widen scope only after truth, graph, release, and performance lanes are credible.

Primary owner:
- COO / Program Lead

Supporting lanes:
- all lanes as needed

Tasks:
1. Add broader curated source coverage.
2. Deepen historical metric backfill and analysis context.
3. Improve briefing quality and delivery options.
4. Add notification or push/email delivery only after operator auth and live deployment exist.
5. Explore richer map animation and geospatial timeline work once performance is under control.

Exit criteria:
- expansion work does not destabilize the core truth/release loop
- new surfaces and delivery modes sit on top of a stable operating system

## Full Todo List By Lane

### COO / Program Lead
- keep `STATUS.md`, `docs/CODEX-STATE.md`, `docs/CODEX-NEXT-STEPS.md`, and this plan synchronized
- keep the heartbeat delta-focused and reviewable
- choose the next slice after every commit without waiting for new direction
- keep the queue honest: what is blocked, what is next, what is external

### Product / Editorial Lead
- refine snapshot hierarchy and trust framing
- improve public-safe copy on briefing, timeline, and source surfaces
- tighten explanation of freshness, review gating, and uncertainty
- keep the product distinct from a generic dashboard or news feed

### Frontend Lead
- complete canonical drill-down UX
- improve map/timeline/story/briefing cohesion
- reduce mobile density pain
- improve preview board usefulness and change visibility
- keep performance pressure visible in the build lane

### Platform / Backend Lead
- activate entity/claim/relationship storage and APIs
- harden config and deployment boundaries
- add operator auth hooks and protected mutations
- keep SQLite lifecycle and seed/rebuild paths safe

### Data Ingestion Lead
- improve merge and normalization rules
- add more structured extractors for KPI suggestions
- widen the feed lane only where review logic is ready
- keep ingestion runs idempotent and explainable

### Intelligence QA Lead
- reduce the current critical queue
- improve source scoring and evidence standards
- tighten publication rules for reviewed KPIs and claims
- keep public stale-state semantics honest

### SRE / Release Lead
- land a real deploy target
- set `PUBLIC_BASE_URL`
- make live verification non-optional
- add runtime stale-data and failure detection
- keep preview/build/smoke artifacts dependable

## Immediate Sequence To Run Without Stopping
1. Clear the remaining stale top-line truth gap through the operator lane and current critical queue.
2. Deepen the live canonical entity/claim/relationship graph and extend the remaining public drill-down lanes into it.
3. Harden ingestion synthesis so the graph updates cleanly from live evidence.
4. Wire a real deployment target and live verification.
5. Reduce the MapLibre/performance burden and improve preview proof.
6. Only then widen scope into more feeds, richer history, and distribution features.

## What Gets Deprioritized Until The Above Is Done
- large-scale design flourishes that do not improve trust or usability
- broader feed expansion before synthesis quality improves
- push/email delivery before deployment and auth exist
- map animation work before the current vendor/performance cost is under control
