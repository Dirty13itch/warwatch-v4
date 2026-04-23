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
- Public API routes: overview, events, event detail, metric history, briefings, map layers, stories, sources, graph snapshot, entity dossier
- Operator API routes: review queue, approve/reject actions, ingestion runs, manual ingest trigger
- Seed path: legacy V3 bundle plus blueprint-derived launch briefing and review backlog
- Reporting path: heartbeat script writes a reviewable markdown artifact
- Client runtime is surface-aware and split by lane:
  - the home surface now acts as the public/demo-first website lane instead of a product-shell snapshot
  - the public shell now has shareable route URLs across its website surfaces, so home, timeline, signals, briefings, dossiers, and command can all be opened directly instead of only through in-app state
  - route-aware document metadata now updates with public surface changes, which gives the website lane real page titles/descriptions instead of one static shell title
  - the server now also injects route-aware metadata into the delivered HTML itself, so canonical, robots, title, and OG/Twitter fields are correct on first response before hydration
  - snapshot and operator/public reader lanes now use differentiated panel roles, stronger severity hierarchy, and explicit focus-visible treatment instead of one repeated shell-card pattern
  - the app chrome is now a compact masthead rather than a second hero, so the homepage can carry the actual first-view composition like a real site
  - the mobile shell header is now compressed enough to surface navigation and status earlier, so homepage content starts sooner on phones
  - the home surface now also exposes graph-backed dossier entry cards and claim posture so the landing lane can open directly into actor context
  - command shell lazy-loads heavy map/chart code
  - timeline surface now exposes filters, event inspection, corroboration, and public posture directly in the UI
  - timeline events can now hand readers into matched source posture when the source ledger has a canonical match
  - timeline events can now also hand readers into matched actor dossiers when the graph has a canonical entity match
  - dossiers surface now exposes the actor/claim/relationship graph as a public reader lane instead of leaving the graph buried in SQLite
  - story and briefing lanes now provide selection-aware reader depth instead of static text dumps
  - story strips and briefing readers can now also hand into matched actor dossiers, so the graph is reachable from fronts, signals, and SITREP context
  - briefing references can now hand readers into matched timeline events instead of ending at raw citation text
  - signals now includes a selection-aware source reader tied to canonical stories and source posture
  - source posture now also hands directly into matched actor dossiers and defaults toward more explanatory sources when possible
  - operator console is separated from the public bundle
  - timeline, signals, and briefings fetch only the data they need
- client and server graph features now share one entity-matching substrate instead of carrying separate matching heuristics
- Overview freshness is derived from top-line KPI freshness, not just latest event activity
- RSS/event ingestion now dedupes by normalized title/category/date window and upgrades corroboration/source refs on merge
- RSS/event ingestion now also resolves near-duplicate rewritten feed titles through keyword/entity compatibility and appends distinct corroborating detail when the event row is upgraded
- RSS/event ingestion now also applies a mission-scope firewall so obviously off-scope general-feed items are skipped or quarantined instead of leaking into public surfaces
- RSS/event ingestion now also has classifier guardrails for explainers, fleet trackers, and defense-industrial copy, so "bomb", "missile", or "carrier strike group" phrasing stops auto-escalating background articles into the critical strike queue
- Market ingestion now writes canonical metric snapshots for Brent, WTI, and gold from Yahoo Finance
- Signals surface renders live market history directly from the canonical metric store
- Daily SITREP generation refreshes the same-day briefing and includes market movement when live snapshots exist
- Operator API exposes reviewed top-line metric publishing for the public KPI lane
- Operator API now also supports explicit reviewed holds for top-line metrics when current evidence is not yet defensible for public publication
- Operator API also exposes evidence-backed top-line suggestions derived from recent event context
- Operator API now also exposes graph-aware synthesis candidates for story and claim promotion based on recent event evidence
- Operator API now also exposes queue actions for synthesis candidates, and review approval can persist approved story/claim suggestions into canonical records
- Operator synthesis candidates are now built from clustered evidence instead of a single strongest event, which gives the operator lane event/source counts and richer evidence packets before promotion
- Operator synthesis clustering now applies active-window pruning and topic/entity compatibility splitting, which stops unrelated high-volume `Threat Level` events from collapsing into the same promotion lane
- Operator API now exposes aggregate review-queue SLA summary data for backlog pressure and aging
- Operator API now also exposes a selection-aware review dossier for each queue item, including canonical object detail, feed/link metadata, related evidence events, and superseding briefing context
- Review dossiers now also unpack story/claim suggestion payloads and canonical matches, so the operator lane can review promotion candidates as first-class objects instead of opaque metadata
- Operator auth now hardens automatically once the app is public-facing: if `PUBLIC_BASE_URL` is set, production mode is on, or `WARWATCH_REQUIRE_OPERATOR_KEY=true`, operator routes require `OPERATOR_API_KEY`
- The runtime now exposes `/sitemap.xml` for the public website lane, and local/public verification now expects website routes plus manifest and robots surfaces instead of only API health
- Aggregate stale-state logic can now clear through a mix of live/ingested and `operator_reviewed` top-line metrics
- Heartbeat artifact includes explicit top-line metric rows plus queue-aging summary in addition to aggregate freshness state
- Build output now isolates React, chart, and MapLibre vendor lanes, with MapLibre kept off the initial shell through dynamic import
- Preview proof now exists as a repo script: `npm run preview:shots` captures desktop/mobile screenshots from the built app and writes `reports/previews/LATEST.md`
- Preview proof also emits `reports/previews/latest/preview-board.png`, a single stitched board artifact for human-facing updates
- Preview proof now also emits a first-class atlas entrypoint at `reports/previews/latest/index.html` plus `preview-atlas.html` and `preview-atlas.pdf`, so the entire product can be reviewed from one local artifact
- `npm run preview:open` now opens the latest atlas directly, which turns preview proof into a real walkthrough surface instead of a folder of PNGs
- Preview proof now opens the public routes directly instead of clicking through the shell, so the artifact lane exercises real URL entry as part of capture
- Preview proof now includes the Snapshot surface as the primary visual/demo lane
- Preview proof now also includes the upgraded timeline surface so exploration depth is visible in each artifact pass
- Preview proof now also includes the briefing reader surface so archive usability is visible in each artifact pass
- Preview proof now also validates the cross-surface handoff lane by keeping timeline, signals, and briefing readers in the same artifact set
- Preview proof now also includes the dossiers surface and focused dossier detail so graph progress is visible in each artifact pass
- Preview proof now also includes focused snapshot-dossier and source-reader captures so graph-entry improvements are visible in each artifact pass
- Preview proof now also includes the operator synthesis lane so graph-promotion work stays visible in each artifact pass
- Build proof now also exists as a repo artifact: every build writes `reports/build/LATEST.md` and `LATEST.json`, and the heartbeat surfaces bundle totals plus the largest client assets
- A multi-stage Dockerfile now packages the built website/server plus seed sources for fresh runtime bootstrap instead of treating deployment as a future-only docs task
- Render is now the explicit first deployment target, with a repo-native `render.yaml` blueprint and `docs/DEPLOYMENT.md` runbook for the single-instance persistent-SQLite runtime
- Event ingestion now writes canonical `entity:*` tags on insert/merge, and `npm run backfill:entity-tags` can normalize the historical event store onto the same tagging scheme
- Operator KPI suggestions now use entity-aware relevance instead of pure regex scanning, which reduces false positives in stale-metric review
- `npm run review:publish-holds` can now replace the remaining seed-era strike, Hormuz, and casualty KPIs with explicit reviewed holds in the local runtime

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
- The live feed lane is now materially cleaner: obvious sports, tourism, and unrelated global stories from broad RSS feeds are quarantined away from public surfaces
- Public stale state remains expected, but it is now narrowed to `review_hold` instead of `stale_seed`: strike, Hormuz, and casualty top-line metrics are explicitly on reviewed hold rather than silently carrying bootstrap-era values
- The operator console can now surface current evidence for stale KPIs, but it will not invent values where extraction is not defensible
- The operator console can now publish either reviewed values or reviewed holds, which makes the public stale-state semantics honest even when live evidence is insufficient for a current number
- The operator console can now also surface graph-aware story and claim candidates, which gives ingestion a canonical promotion path before any write-side automation exists
- The operator console can now also queue those graph-aware promotion candidates and approve them into canonical stories/claims through the normal review gate
- The operator console now also sees clustered event/source counts on synthesis candidates and review dossiers, which makes the strength of each promotion lane more legible
- The operator synthesis lane is now materially less noisy on high-volume claim classes because stale evidence is pruned and unrelated threat topics split into separate candidates
- The operator console can now see queue pressure directly through age buckets and SLA summary cards, which gave the COO lane a concrete review-backlog surface and is now sitting at zero pending after the reconciliation pass
- The operator console can now turn a queue row into a real review packet and jump straight into timeline evidence from the operator lane
- The repo now has a deterministic queue-reconciliation script (`npm run review:reconcile`) that reclassifies bad auto-ingest criticals, promotes matched claim suggestions, and rejects superseded launch briefings instead of leaving backlog cleanup as a manual chat loop
- The COO lane can now attach actual UI evidence to updates through local preview screenshots instead of relying only on text artifacts
- The COO lane can now point to one local full-preview atlas instead of forcing review through individual PNG links or a stitched board alone
- The website lane now has real static public assets (`favicon.svg`, `og-card.svg`, `site.webmanifest`, `robots.txt`) and route-aware head metadata instead of a generic Vite shell title
- The website lane now also has first-response route metadata from the server, so direct entries and crawlers no longer depend on client-side meta replacement alone
- The preview lane now reflects the stronger hierarchy pass instead of the older flatter card system, and the mobile artifact shows the tighter hero/nav/status shell rather than the earlier oversized first screen
- Public reader surfaces no longer dead-end as quickly: snapshot, source posture, briefing refs, events, stories, and briefings can all jump into dossier graph detail
- Shared entity matching now reduces drift between what the client thinks is related and what the server uses for dossier context
- Canonical entity tagging is now persisted into the event store instead of remaining only an on-the-fly graph helper
- The operator suggestion lane is now safer against off-target shipping/casualty evidence because entity-aware ranking gates the top-line extraction path
- The ingestion lane is now less duplicate-prone on rewritten wire copy and less merge-prone on broad same-theater language, which makes the canonical event spine safer before further feed expansion
- Scope gating is still heuristic and rules-based, so borderline regional-spillover judgments remain a tuning lane rather than a solved problem
- Critical claims continue to require operator approval before promotion to primary public surfaces
- Container build proof is currently machine-blocked on this workstation because `docker` is not installed or not on PATH, even though the repo-level packaging recipe now exists
- Render blueprint validation and live service creation are likewise blocked by missing local Render tooling/account context, not by missing repo scaffolding
