# WarWatch V4 — Full Audit, Gap Analysis & Transformation Blueprint

**Date:** April 20, 2026 (Day 52)
**Author:** WarWatch Engineering
**Purpose:** Transform WarWatch from a manually-updated static dashboard into a living intelligence fusion platform

---

## PART 1: PURPOSE ANALYSIS — What Is This Actually For?

Before auditing features, we need to answer: **what is this tool supposed to do for the user?**

The user's own words across this project:
- "I want truth verified. Up to date. Most current."
- "Many of the largest news organizations I consider to be propaganda machines"
- "What about things like the Pentagon pizza delivery index — less official indicators"
- "Where are the gaps? What could be done better?"
- "How can you use the intel sources to properly extrapolate and see what is coming?"
- "I want specific details"
- "Something that shows me in order, the latest important updates, chronological, includes everything"

**Synthesized purpose:** The user wants a **single place where they can understand what is actually happening in this war — not what any single source says is happening, but what the evidence across all sources reveals.** They want to see through propaganda from all sides, track the war's trajectory over time, anticipate what's coming next, and have specific details at their fingertips from sources that mainstream media filters out.

**This is not a news aggregator.** It's not a pretty dashboard. It's a **personal intelligence fusion center.**

The purpose drives every decision below.

---

## PART 2: FULL AUDIT — What We Have (52 Days In)

### Architecture
| Component | Current State | Grade |
|-----------|--------------|-------|
| Frontend | Vanilla HTML/CSS/JS, 12 files, 408KB total | B |
| Backend | None — static S3 deployment | F |
| Database | None — all data in JS objects | F |
| Data freshness | Manual updates only — stale within hours | D |
| Live feeds | RSS via rss2json.com (client-side), TradingView embeds, USGS API, ADS-B iframe | C+ |
| Monitoring | External cron every 3 hours (search + alert) | B- |
| Mobile | Not responsive — desktop-only grid layout | F |
| Performance | Fast (static files, no API calls) | A |

### Data Layer (data.js — 865 lines, 38 data objects)
| Object | Lines | Last Updated | Freshness | Quality |
|--------|-------|--------------|-----------|---------|
| WW.KPI | 20 | Day 41 (Apr 9) | 11 DAYS STALE | Good but frozen |
| WW.DEADLINE | 25 | Day 41 | STALE — deadline passed, talks collapsed? | Unknown |
| WW.NEGOTIATION | 70 | Day 41 | STALE — Islamabad talks happened/failed? | Unknown |
| WW.FRONTS | 50 | Day 41 | STALE — ceasefire status unclear | Critical gap |
| WW.CASUALTIES | 25 | Day 41 | STALE | Growing gap |
| WW.COUNTRY_ATTACKS | 15 | Day 31 | 21 DAYS STALE | Seriously outdated |
| WW.MUNITION_DEPLETION | 25 | Day 31 | 21 DAYS STALE | Critical gap |
| WW.US_LOSSES | 100 | Day 41 | 11 DAYS STALE | Good structure |
| WW.IRAN_ACHIEVEMENTS | 45 | Day 41 | 11 DAYS STALE | Comprehensive |
| WW.ECONOMIC_IMPACT | 90 | Day 41 | 11 DAYS STALE | Was good |
| WW.SCENARIOS | 60 | Day 41 | STALE — ceasefire changed everything | Needs recalc |
| WW.ORBAT | 15 | Day 39 | STALE | Good structure |
| WW.ESCALATION_LADDER | 15 | Day 41 | STALE — Touska seizure is new rung | Gap |
| WW.HVT | 15 | Day 41 | Probably stale | Incomplete |
| WW.INDICATORS | 40 | Day 31 | 21 DAYS STALE | Many outdated |
| WW.NUCLEAR_SITES | 15 | Day 31 | 21 DAYS STALE | Needs Bushehr update |
| WW.PRESS_FREEDOM | 20 | Day 39 | Stale | Incomplete |

**Verdict: The data layer is 11-21 days stale on every metric.** A "command center" that shows Day 41 data on Day 52 is not a command center. It's an archive.

### Timeline (timeline-data.js — 1,577 lines, 159 events)
- Covers Feb 27 – April 7 (Day 39)
- **Missing 13 days** (April 8 – April 20)
- Key missing events: Touska seizure (Apr 19), Islamabad talks outcome, ceasefire status, Hormuz mine charts, Lebanon escalation continuation
- Structure is good (date, time, title, detail, source, category, significance)
- Needs ~40-60 new events minimum

### UI/UX (index.html — 732 lines, 8 tabs)
| Tab | Content | Quality | Issues |
|-----|---------|---------|--------|
| Map | MapLibre + markers + layers + attack bubbles | B+ | Static markers, no animation, no temporal dimension |
| Fronts | 5 fronts + casualties + country attacks + depletion + CSG + US losses + Iran achievements + HVT | A- | Information-dense, well-organized |
| Intel | RSS feeds + CENTCOM embed + Telegram links | C | Feeds often fail (CORS), CENTCOM embed broken |
| Analysis | Negotiation + escalation + scenarios + DIME + ORBAT | B+ | All data frozen at Day 41 |
| Economic | TradingView charts + ADS-B + shipping KPIs + timeline | B | Live charts are good, surrounding data stale |
| Media | Independent journalists + OSINT + streams + official | B | YouTube embeds work, video feeds often empty |
| Signals | 12 unconventional indicators | B- | Many status descriptions outdated |
| Timeline | 159 events, filterable, searchable | A- | Missing 13 days |

### CSS (4 files — 1,767 lines total)
- Dark ops military aesthetic — well-executed
- No responsive breakpoints below 1200px — **completely unusable on mobile**
- Hover effects, animations, transitions are polished
- v3.css is getting bloated (815 lines) — could use refactoring

### External Integrations
| Integration | Method | Status | Reliability |
|-------------|--------|--------|-------------|
| TradingView | Embed widgets | Working | High — real live data |
| ADS-B Exchange | iframe | Working | Medium — sometimes blocked |
| USGS Earthquake | Fetch API | Working | High |
| RSS Feeds | rss2json.com proxy | Intermittent | Low — CORS issues, rate limits |
| YouTube Embeds | iframe | Working | High |
| Twitter/X Embed | Widget JS | Broken | Very low — often fails to load |
| MapLibre | CDN | Working | High |
| Cloudflare Radar | Link only | N/A | Not integrated — just a link |
| MarineTraffic | Link only | N/A | Not integrated |
| GPSJam | Link only | N/A | Not integrated |

### Monitoring Cron
- Runs every 3 hours (7am, 10am, 1pm, 4pm, 7pm, 10pm CDT)
- Searches ISW, CENTCOM, Reuters, Al Jazeera, OSINT X accounts
- Compares against escalation triggers
- Only notifies on significant developments
- **Does NOT write data back to the dashboard** — this is the critical gap
- Working well for alerting; useless for keeping the dashboard current

---

## PART 3: GAP ANALYSIS — What's Missing

### Critical Gaps (the dashboard is lying without these)
1. **No auto-updating data.** Every number requires a manual session. The monitoring cron detects changes but can't fix them.
2. **No time-series.** You can't see trajectories. Oil went from $70 → $144 → $95 → ???. You just see "$109."
3. **No mobile support.** You can't check this on your phone.
4. **11-21 day data staleness.** The "command center" shows old information.
5. **No source confidence scoring.** CENTCOM claims and Ritter claims displayed with equal weight.

### Major Gaps (the dashboard is incomplete without these)
6. **No automated news ingestion.** RSS feeds show headlines but don't extract structured intelligence.
7. **No predictive modeling.** Scenario probabilities are gut feel, frozen in time.
8. **No animated map.** Can't see the war unfold geospatially over time.
9. **No daily briefing.** No executive summary — you have to browse 8 tabs to understand the situation.
10. **No satellite imagery.** The user specifically asked for this. We have links but no integration.

### Nice-to-Have Gaps (would elevate from good to exceptional)
11. **No collaboration.** Can't share specific views, annotate, or discuss.
12. **No email digest.** No way to get a daily email summary.
13. **No dark/light mode persistence.** Theme resets on reload (localStorage blocked in iframe).
14. **No keyboard shortcuts.** Tab switching requires mouse clicks.
15. **No export.** Can't export timeline events, ORBAT table, or briefings as PDF.

---

## PART 4: TRANSFORMATION PLAN

### Phase 1: Foundation (Fullstack Rebuild) — The Critical Change

**What:** Rebuild WarWatch as a fullstack web application using the webapp template (Express + Vite + React + SQLite + Tailwind).

**Why:** Everything else depends on having a backend and database. Without this, the dashboard will always be manually updated static files.

**Architecture:**
```
┌──────────────────────────────────────────────────┐
│                   FRONTEND (React)                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ │
│  │ Map  │ │Fronts│ │Tline │ │Anlys │ │Briefing│ │
│  └──────┘ └──────┘ └──────┘ └──────┘ └────────┘ │
│                      ↕ API                        │
├──────────────────────────────────────────────────┤
│                  BACKEND (Express)                 │
│  ┌────────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Data API   │  │ Ingest   │  │ LLM Extract   │ │
│  │ /api/kpi   │  │ Crons    │  │ News → Events │ │
│  │ /api/events│  │ Oil/USGS │  │ ISW → Data    │ │
│  │ /api/series│  │ RSS/ADS-B│  │ CENTCOM→Data  │ │
│  └────────────┘  └──────────┘  └───────────────┘ │
│                      ↕ DB                         │
├──────────────────────────────────────────────────┤
│               DATABASE (SQLite)                    │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐│
│  │ events   │ │ metrics  │ │ sources            ││
│  │ (timeline│ │ (time-   │ │ (confidence,       ││
│  │  items)  │ │  series) │ │  reliability)      ││
│  └──────────┘ └──────────┘ └────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Database Schema:**
```sql
-- Every data point with timestamp for time-series
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL,        -- 'oil_brent', 'hormuz_ships', 'casualties_iran', etc.
  value REAL,
  value_text TEXT,          -- for non-numeric values
  timestamp TEXT NOT NULL,  -- ISO 8601
  source TEXT,
  confidence TEXT           -- 'confirmed', 'reported', 'claimed', 'disputed'
);

-- Timeline events (replaces timeline-data.js)
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  category TEXT NOT NULL,   -- us_strike, iran_strike, diplomatic, etc.
  significance TEXT NOT NULL,-- critical, high, medium
  confidence TEXT DEFAULT 'reported',
  corroboration INTEGER DEFAULT 1,  -- number of independent sources
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source reliability tracking
CREATE TABLE sources (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,                -- 'official_us', 'official_iran', 'independent', 'osint', 'state_media'
  reliability_score REAL,   -- 0-1 based on historical accuracy
  bias_direction TEXT,      -- 'pro_us', 'pro_iran', 'neutral', 'anti_both'
  notes TEXT
);

-- Daily snapshots for time-series
CREATE TABLE daily_snapshot (
  id INTEGER PRIMARY KEY,
  conflict_day INTEGER NOT NULL,
  date TEXT NOT NULL,
  oil_brent REAL,
  oil_wti REAL,
  hormuz_ships INTEGER,
  strikes_cumulative INTEGER,
  casualties_iran_low INTEGER,
  casualties_iran_high INTEGER,
  casualties_us INTEGER,
  interceptors_thaad_pct REAL,
  iran_internet_pct REAL,
  scenario_a_pct REAL,
  scenario_b_pct REAL,
  scenario_c_pct REAL,
  scenario_d_pct REAL,
  scenario_e_pct REAL,
  notes TEXT
);
```

**Backfill:** We have 6 research documents totaling ~3,000 lines of sourced data. These get parsed into the database on initial setup, giving us 52 days of historical data from day one.

### Phase 2: Auto-Ingestion (The Dashboard Comes Alive)

**Server-side cron jobs running inside the Express backend:**

| Feed | Frequency | Method | What it populates |
|------|-----------|--------|-------------------|
| Brent/WTI oil prices | Every 1 hour | Free API (exchangerate or Yahoo Finance) | `metrics` table |
| Gold price | Every 1 hour | Same | `metrics` table |
| USGS earthquakes (Iran bbox) | Every 15 min | USGS GeoJSON API | `events` + `metrics` |
| Cloudflare Radar (Iran) | Every 6 hours | Cloudflare API (free tier) | `metrics` table |
| ISW/Critical Threats RSS | Every 30 min | RSS fetch + LLM extraction | `events` table |
| CENTCOM press releases | Every 1 hour | RSS fetch + LLM extraction | `events` table |
| Al Jazeera ME RSS | Every 30 min | RSS fetch | `events` table |
| Reuters World RSS | Every 30 min | RSS fetch | `events` table |
| Defense News RSS | Every 1 hour | RSS fetch | `events` table |

**LLM Extraction Pipeline:** When a new article from ISW or CENTCOM arrives:
1. Fetch full article text
2. Send to LLM with structured extraction prompt:
   - "Extract: date, title, detail, category, significance, specific numbers mentioned"
3. LLM returns structured JSON
4. Insert into `events` table with `confidence: 'auto_extracted'`
5. Flag for human review if significance = 'critical'

This means the timeline auto-populates. Not perfectly — LLM extraction will miss nuance. But it captures 80% of events automatically, and the user can correct/annotate the rest.

### Phase 3: Time-Series Visualization

Every KPI in the sidebar gets a sparkline or expandable chart:

**Implementation:**
- Query `daily_snapshot` table for historical data
- Render with Chart.js (already in the toolkit, lightweight)
- Sparklines inline in KPI cards (30-day mini line)
- Click to expand to full chart with annotations

**Key time-series:**
- Oil price trajectory (Brent + WTI, dual axis)
- Hormuz throughput (ships/day with blockade/ceasefire annotations)
- Cumulative strikes
- Cumulative casualties (all parties, stacked)
- Interceptor depletion curves
- Iran internet uptime (flatline at ~1% — itself powerful to show)
- Scenario probability evolution (how predictions changed over time)

### Phase 4: Intelligence Confidence Scoring

Every event and claim in the system gets tagged:

**Confidence Levels:**
| Level | Meaning | Visual |
|-------|---------|--------|
| CONFIRMED | 3+ independent sources agree | Green solid badge |
| REPORTED | 2 independent sources | Blue badge |
| CLAIMED | Single source, unverified | Amber badge |
| DISPUTED | Sources contradict each other | Red striped badge |
| UNVERIFIED | Auto-extracted, not yet reviewed | Gray dashed badge |

**Source Reliability Scores:**
| Source | Type | Reliability | Bias |
|--------|------|-------------|------|
| CENTCOM | Official US | 0.7 | Pro-US (omits losses) |
| ISW/CritThreats | Think tank | 0.8 | Pro-US framing |
| Reuters/AP | Wire service | 0.85 | Neutral-West |
| Al Jazeera | Regional | 0.75 | Pro-Arab |
| IRNA/PressTV | State media Iran | 0.3 | Pro-Iran (propaganda) |
| Scott Ritter | Independent | 0.5 | Counter-narrative |
| Pepe Escobar | Independent | 0.5 | Counter-narrative |
| Drop Site News | Investigative | 0.7 | Counter-narrative |
| Bellingcat | OSINT | 0.9 | Neutral-forensic |
| @sentdefender | OSINT | 0.75 | Neutral-OSINT |

When two sources disagree, the UI shows both claims side by side with their reliability scores.

### Phase 5: Animated Geospatial Timeline

The map gets a time slider at the bottom:
- Drag from Day 1 to Day 52
- Strikes appear as animated dots (color-coded: US=blue, Iran=red, proxy=orange)
- Intensity builds over time — you SEE the campaign's rhythm
- Pause on any day to see that day's events in a sidebar panel
- Hormuz shipping lane visualization (green when open, red when blocked, orange when restricted)
- Lebanon front line animation (IDF advance markers over time)

**Data source:** Our 159+ timeline events already have dates. Add lat/lon coordinates to events and they become mappable.

### Phase 6: Daily Briefing Generator

Every morning at 7am CDT, the system:
1. Queries all events from the past 24 hours
2. Queries metric changes (oil moved, ships passed, etc.)
3. Sends to LLM with prompt: "Generate a 500-word executive intelligence briefing in SITREP format"
4. Stores the briefing in the database
5. Displays in a "Briefing" tab — one per day, scrollable archive
6. Optionally sends as push notification or email

**SITREP format (based on military intelligence briefing standards):**
1. SITUATION — What happened in the last 24 hours
2. ENEMY — Iranian/proxy actions
3. FRIENDLY — US/coalition actions
4. ASSESSMENT — What this means
5. OUTLOOK — What to watch in the next 24 hours

### Phase 7: Mobile PWA

- Service worker for offline access
- manifest.json for install-to-home-screen
- Responsive layout: sidebar collapses to hamburger, tabs become bottom nav, KPIs stack vertically
- Push notifications from the monitoring cron
- "Glance mode" — a single-screen summary optimized for phone: threat level, top 3 KPIs, last 3 events, scenario probabilities

---

## PART 5: BUILD ORDER & ESTIMATES

| Phase | What | Depends On | Complexity |
|-------|------|-----------|------------|
| 1 | Fullstack rebuild + DB + backfill | Nothing | High — full rewrite |
| 2 | Auto-ingestion crons | Phase 1 | Medium |
| 3 | Time-series charts | Phase 1 | Medium |
| 4 | Confidence scoring | Phase 1 | Low-Medium |
| 5 | Animated map | Phase 1 + event geocoding | High |
| 6 | Daily briefing | Phase 1 + Phase 2 | Medium |
| 7 | Mobile PWA | Phase 1 | Medium |

**Recommended approach:** Build Phase 1-3 together as the V4 launch. This gives us: fullstack app, database, auto-ingestion, and time-series — the three things that make the biggest difference. Then layer Phases 4-7 iteratively.

---

## PART 6: WHAT THIS LOOKS LIKE WHEN IT'S DONE

**Day 53, 7:00 AM:** You wake up. Your phone has a push notification: "WarWatch Morning Brief — Day 53."

You tap it. A 500-word SITREP loads:
> SITUATION: Islamabad talks Day 3. Araghchi walked out at 2:14 AM over Lebanon inclusion. Vance flew to Ankara to pressure Erdogan. Brent +4% to $103 on talk collapse fears. Hormuz: 11 ships yesterday (IRGC-approved corridor). No new strikes on Iranian territory. Hezbollah fired 14 rockets at Galilee.
> 
> ASSESSMENT: Talks at breaking point over Lebanon. If Araghchi doesn't return by tonight, ceasefire framework expires April 22 with no renewal. Scenario C (Escalation) probability rising — now 30%.

You glance at the KPI dashboard — all numbers are current as of 6:45 AM. Oil sparkline shows the overnight spike. Hormuz throughput chart shows the day-by-day decline. Casualty curve continues to climb.

You tap the map. Slide the timeline to yesterday. Watch the 14 Hezbollah rockets appear as orange dots in Galilee. Zoom to Hormuz — see the 11 green ship icons threading through the IRGC corridor, 400+ red icons stacked up outside.

You tap the Timeline. Filter to "diplomatic." See last night's events: "Araghchi walks out of Islamabad talks (2:14 AM) — Al Jazeera, CONFIRMED [3 sources]." Below it: "Vance departs for Ankara (4:30 AM) — Reuters, REPORTED [1 source]."

You tap "Analysis." Scenario probabilities have shifted overnight — the system auto-recalculated when the walkout event was logged. Ceasefire scenario dropped from 38% to 25%. Escalation rose from 22% to 30%.

That's the vision. Not a dashboard you visit when someone updates it. A living intelligence platform that's always current, always sourced, always showing you the trajectory — not just the snapshot.
