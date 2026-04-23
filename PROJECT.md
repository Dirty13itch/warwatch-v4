# WarWatch V4

WarWatch V4 is the maintained replacement for the static WarWatch V3 dashboard.

## Mission
Build a living intelligence fusion platform for the Iran conflict that prioritizes verified current truth, source weighting, operator review, and public-safe presentation.

## Product Shape
- Public command center for overview, map, fronts, charts, timeline, signals, stories, and briefings
- Operator console for review queue, ingestion runs, and source governance
- Canonical data layer for sources, claims, events, metrics, stories, entities, relationships, briefings, review items, and ingestion runs
- SQLite-backed backend with server-side ingestion and report generation
- Live public website on Vercel at `https://warwatch-v4.vercel.app`
- Hosted Vercel lane is intentionally `public_readonly`: one function-backed public API plus a committed `data/public-snapshot.json` artifact, with no hosted scheduler or write-side operator actions
- Full mutable runtime remains the local Express + SQLite + scheduler lane until persistence moves off local disk or a paid single-instance host is warranted
- Published GitHub repo: `https://github.com/Dirty13itch/warwatch-v4`

## Non-Negotiables
- Critical claims require review before public promotion.
- Legacy V3 content is seed/reference material, not the active app.
- Every core surface must be type-backed and API-backed.
- The project carries an autonomous COO lane through docs, scripts, and heartbeat automation.
