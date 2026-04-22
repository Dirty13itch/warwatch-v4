# WarWatch Team Roster

## Operating Model
- One permanent operator runs seven standing senior lanes as a single coordinated product organization.
- Every landed slice must resolve to one primary lane owner, one proof path, and one reviewable artifact.
- Work runs in a strict sequence: unblock truth, deepen canonical data, improve public product, harden release/runtime, then widen scope.
- The organization should not stop between slices unless it reaches a real external boundary: missing deploy target, missing secret, human-only review decision, or missing defensible evidence.

## Core Cadence
- Primary cadence: twice-daily COO heartbeat in `America/Chicago`
- Slice cadence: one end-to-end vertical improvement at a time on the critical path
- Closeout contract for each meaningful slice:
  - code or doc change landed
  - smallest useful proof run
  - preview refreshed if public UI changed
  - heartbeat refreshed if runtime truth changed
  - repo truth surfaces synced if priorities or reality changed

## Standing Lanes

### COO / Program Lead
- Mandate: choose the next highest-leverage unblocked slice, maintain repo truth, and keep the whole program moving without orchestration drift
- Owns: `STATUS.md`, `docs/CODEX-STATE.md`, `docs/CODEX-NEXT-STEPS.md`, `plans/active/`, heartbeat interpretation, tranche sequencing
- Success looks like:
  - no stale plan/docs drift
  - no idle gap between slices unless the blocker is real
  - updates show what landed, what is blocked, and what is next

### Product / Editorial Lead
- Mandate: make the public product readable, trustworthy, and useful without turning it into a generic news site
- Owns: information hierarchy, public-safe framing, snapshot/briefing narrative shape, source explanation, trust language
- Success looks like:
  - public surfaces explain posture and uncertainty clearly
  - readers can move deeper without losing context
  - public copy stays sober and operator-safe

### Frontend Lead
- Mandate: ship the shell people actually see and use across desktop and phone
- Owns: snapshot, command, timeline, signals, briefings, operator UX, responsive behavior, preview artifacts, performance-facing UI changes
- Success looks like:
  - mobile remains first-class
  - preview board stays demo-ready
  - public lanes feel connected rather than isolated

### Platform / Backend Lead
- Mandate: keep the app spine coherent, typed, and deployable
- Owns: Express API, SQLite schema/storage, config/env contracts, server-side workflows, auth hooks, deployment boundaries
- Success looks like:
  - every surface resolves against canonical APIs
  - migrations and seed paths stay safe
  - deployment/runtime contracts are explicit instead of implied

### Data Ingestion Lead
- Mandate: turn external feeds into clean canonical records without duplicate inflation or unsafe auto-promotion
- Owns: feed definitions, normalization, dedupe, enrichment, metric extraction, story/claim synthesis inputs
- Success looks like:
  - ingestion stays healthy and idempotent
  - source refs and corroboration improve instead of drifting
  - new live evidence becomes usable by operator tools quickly

### Intelligence QA Lead
- Mandate: protect public truth quality and keep the review gate meaningful
- Owns: source scoring, confidence policy, corroboration rules, review queue severity, KPI publication standards, operator-review semantics
- Success looks like:
  - critical claims do not leak past review
  - queue pressure is visible and actionable
  - defensible current values can be published without inventing facts

### SRE / Release Lead
- Mandate: make the product releasable, monitorable, and continuously provable
- Owns: CI/verify contract, smoke paths, live verification hooks, deployment target, runtime health checks, performance budgets, release proof
- Success looks like:
  - `npm run verify` stays green
  - live verify works once the deployment target exists
  - runtime regressions and stale-data failures become visible fast

## Execution Rules
- Keep one critical-path slice in flight and treat proof, previews, and docs as required sidecars instead of optional cleanup.
- Prefer vertical slices that change the public product and the operator truth model together.
- Do not widen the scope while stale public-truth blockers remain unresolved unless a new slice directly reduces that blocker.
- When a slice changes reader behavior, refresh previews. When a slice changes runtime/data truth, refresh the heartbeat.
- If the next step repeats the same manual loop, prefer a script, typed helper, or automation instead.

## Real Stop Boundaries
- Deployment work that needs an actual provider target or secret
- Public verification that needs `PUBLIC_BASE_URL`
- KPI or claim publication that lacks defensible current evidence
- Human-only editorial approval where the product contract explicitly requires review
