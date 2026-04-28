import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";
import { openDatabase } from "./db";
import { getTopLineSuggestions } from "./topline";
import { upsertPreparedMetricSnapshot } from "./ingest";

function makeDb() {
  const config = loadConfig(process.cwd());
  return openDatabase({
    dbPath: ":memory:",
    legacyDir: config.legacyDir,
    blueprintPath: config.blueprintPath
  });
}

function insertEvent(
  db: ReturnType<typeof makeDb>,
  input: {
    id: string;
    date: string;
    title: string;
    detail: string;
    category: string;
    tags?: string[];
    corroboration?: number;
    sourceText?: string;
  }
) {
  db.prepare(`
    INSERT INTO events (
      id, date, time, title, detail, category, significance, confidence, corroboration,
      source_text, source_refs_json, review_state, visibility, geo_json, tags_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.date,
    null,
    input.title,
    input.detail,
    input.category,
    "high",
    "reported",
    input.corroboration ?? 2,
    input.sourceText ?? "Operator Test Feed",
    JSON.stringify([input.sourceText ?? "Operator Test Feed"]),
    "approved",
    "secondary",
    null,
    JSON.stringify(input.tags ?? [input.category]),
    `${input.date}T00:00:00.000Z`
  );
}

function insertStory(
  db: ReturnType<typeof makeDb>,
  input: {
    id: string;
    title: string;
    section?: string;
    summary?: string;
    detail: string;
    significance?: "critical" | "high" | "medium" | "low";
    sourceText?: string;
  }
) {
  db.prepare(`
    INSERT INTO stories (
      id, slug, title, section, summary, detail, significance, source_text, review_state, meta_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.id.replace(/^story_/, ""),
    input.title,
    input.section ?? "front",
    input.summary ?? "AGGREGATE",
    input.detail,
    input.significance ?? "critical",
    input.sourceText ?? "Operator Story Feed",
    "approved",
    "{}"
  );
}

describe("top-line suggestions", () => {
  it("extracts operator candidates from recent event evidence", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_total_strikes",
      date: "2026-04-22",
      title: "Combined campaign crosses 13,420 strikes",
      detail: "Officials say the combined campaign has now exceeded 13,420 strikes across all theaters.",
      category: "us_strike",
      tags: ["us_strike", "entity:united-states", "entity:iran"]
    });
    insertEvent(db, {
      id: "event_hormuz",
      date: "2026-04-22",
      title: "Hormuz corridor capped at 18 ships per day",
      detail: "Shipping trackers describe a controlled corridor holding to 18 ships per day.",
      category: "economic",
      tags: ["economic", "entity:strait-of-hormuz", "entity:iran"]
    });
    insertEvent(db, {
      id: "event_casualties",
      date: "2026-04-22",
      title: "Iran casualty estimate rises again",
      detail: "Multiple analysts now describe 21,500 Iran casualties with the tally still climbing.",
      category: "intel",
      tags: ["intel", "entity:iran"]
    });

    const suggestions = getTopLineSuggestions(db);

    const strikes = suggestions.find((item) => item.key === "total_strikes");
    expect(strikes?.status).toBe("candidate");
    expect(strikes?.candidate?.value).toBe(13420);

    const hormuz = suggestions.find((item) => item.key === "hormuz_daily_cap");
    expect(hormuz?.status).toBe("candidate");
    expect(hormuz?.candidate?.value).toBe(18);

    const casualties = suggestions.find((item) => item.key === "iran_casualties_estimate");
    expect(casualties?.status).toBe("candidate");
    expect(casualties?.candidate?.value).toBe(21500);

    db.close();
  });

  it("ignores generic shipping caps when there is no Hormuz evidence", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_generic_shipping",
      date: "2026-04-22",
      title: "Singapore corridor capped at 54 ships per day",
      detail: "Port authorities say the regional shipping corridor is holding to 54 ships per day.",
      category: "economic",
      tags: ["economic"]
    });

    const suggestions = getTopLineSuggestions(db);
    const hormuz = suggestions.find((item) => item.key === "hormuz_daily_cap");

    expect(hormuz?.status).toBe("no_signal");
    expect(hormuz?.candidate).toBeNull();
    expect(hormuz?.evidence).toHaveLength(0);

    db.close();
  });

  it("surfaces reviewed holds explicitly once a metric is no longer seed-backed", () => {
    const db = makeDb();
    db.exec("DELETE FROM stories;");
    upsertPreparedMetricSnapshot(db, {
      metricKey: "total_strikes",
      value: null,
      valueText: "Awaiting reviewed cumulative strike total",
      unit: "strikes",
      timestamp: "2026-04-22T18:00:00.000Z",
      sourceText: "Operator reviewed hold / no defensible cumulative strike total in the live feed lane",
      confidence: "reported",
      reviewState: "approved",
      freshness: "operator_hold",
      meta: {
        note: "Current live coverage provides strike context but not a defensible cumulative total for public publication.",
        mode: "hold"
      }
    });

    const suggestions = getTopLineSuggestions(db);
    const strikes = suggestions.find((item) => item.key === "total_strikes");

    expect(strikes?.status).toBe("reviewed_hold");
    expect(strikes?.candidate).toBeNull();

    db.close();
  });

  it("surfaces total-strike context from older aggregate target summaries even without a publishable strike total", () => {
    const db = makeDb();
    db.exec("DELETE FROM events; DELETE FROM stories;");

    insertEvent(db, {
      id: "event_total_targets_struck",
      date: "2026-04-01",
      title: "Trump Prime-Time Address: 11,000 Targets Struck, Escalation Vowed",
      detail: "CENTCOM had confirmed 11,000+ total targets struck since February 28.",
      category: "intel",
      corroboration: 2,
      tags: ["intel", "entity:iran"]
    });

    const suggestions = getTopLineSuggestions(db);
    const strikes = suggestions.find((item) => item.key === "total_strikes");

    expect(strikes?.status).toBe("context_only");
    expect(strikes?.candidate).toBeNull();
    expect(strikes?.evidence.length).toBeGreaterThan(0);

    db.close();
  });

  it("surfaces a total-strikes candidate from approved aggregate story evidence with official-source cues", () => {
    const db = makeDb();
    db.exec("DELETE FROM events; DELETE FROM stories;");

    upsertPreparedMetricSnapshot(db, {
      metricKey: "total_strikes",
      value: null,
      valueText: "Awaiting reviewed cumulative strike total",
      unit: "strikes",
      timestamp: "2026-04-28T12:00:00.000Z",
      sourceText: "Operator reviewed hold / no defensible cumulative strike total in the live feed lane",
      confidence: "reported",
      reviewState: "approved",
      freshness: "operator_hold",
      meta: {
        note: "Current live coverage provides strike context but not a defensible cumulative total for public publication.",
        mode: "hold"
      }
    });

    insertStory(db, {
      id: "story_total_strikes_official",
      title: "Iran Air Campaign",
      detail: "13,000+ strikes over 38 days of major combat (CENTCOM Admiral Cooper, Apr 9). Ceasefire halted strikes as of Apr 7.",
      sourceText: "CENTCOM / Reuters / operator review"
    });

    const suggestions = getTopLineSuggestions(db);
    const strikes = suggestions.find((item) => item.key === "total_strikes");

    expect(strikes?.status).toBe("candidate");
    expect(strikes?.candidate?.value).toBe(13000);
    expect(strikes?.candidate?.valueText).toBe("13,000+ campaign strikes");
    expect(strikes?.candidate?.sourceText).toBe("CENTCOM Admiral Cooper (Apr 9) / operator review");

    db.close();
  });

  it("does not surface a total-strikes candidate from approved story text alone when the source is not official enough", () => {
    const db = makeDb();
    db.exec("DELETE FROM events; DELETE FROM stories;");

    upsertPreparedMetricSnapshot(db, {
      metricKey: "total_strikes",
      value: null,
      valueText: "Awaiting reviewed cumulative strike total",
      unit: "strikes",
      timestamp: "2026-04-28T12:00:00.000Z",
      sourceText: "Operator reviewed hold / no defensible cumulative strike total in the live feed lane",
      confidence: "reported",
      reviewState: "approved",
      freshness: "operator_hold",
      meta: {
        note: "Current live coverage provides strike context but not a defensible cumulative total for public publication.",
        mode: "hold"
      }
    });

    insertStory(db, {
      id: "story_total_strikes_weak",
      title: "Legacy strike recap",
      detail: "13,000+ strikes over the campaign, according to recap slides compiled after the ceasefire.",
      sourceText: "Legacy deck / analyst recap"
    });

    const suggestions = getTopLineSuggestions(db);
    const strikes = suggestions.find((item) => item.key === "total_strikes");

    expect(strikes?.status).toBe("reviewed_hold");
    expect(strikes?.candidate).toBeNull();

    db.close();
  });

  it("keeps generic air-campaign or projectile coverage out of total-strike evidence when it lacks an aggregate strike tally", () => {
    const db = makeDb();
    db.exec("DELETE FROM events; DELETE FROM stories;");

    insertEvent(db, {
      id: "event_total_targets_struck_context",
      date: "2026-04-01",
      title: "Trump Prime-Time Address: 11,000 Targets Struck, Escalation Vowed",
      detail: "CENTCOM had confirmed 11,000+ total targets struck since February 28.",
      category: "intel",
      corroboration: 2,
      tags: ["intel", "entity:iran"]
    });

    insertEvent(db, {
      id: "event_generic_air_campaign",
      date: "2026-03-16",
      title: "IDF Launches Ground Operations in Southern Lebanon",
      detail: "The second front opened alongside the air campaign against Iran while Hezbollah fired 1,000+ projectiles into Israel.",
      category: "regional_strike",
      corroboration: 2,
      tags: ["regional_strike", "entity:iran", "entity:israel", "entity:hezbollah"]
    });

    const suggestions = getTopLineSuggestions(db);
    const strikes = suggestions.find((item) => item.key === "total_strikes");

    expect(strikes?.status).toBe("context_only");
    expect(strikes?.candidate).toBeNull();
    expect(strikes?.evidence.map((item) => item.eventId)).toEqual(["event_total_targets_struck_context"]);

    db.close();
  });

  it("keeps reviewed holds contextual when relevant non-numeric evidence exists", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    upsertPreparedMetricSnapshot(db, {
      metricKey: "hormuz_daily_cap",
      value: null,
      valueText: "Awaiting reviewed Hormuz throughput cap",
      unit: "ships_per_day",
      timestamp: "2026-04-24T12:00:00.000Z",
      sourceText: "Operator reviewed hold / no defensible current Hormuz throughput cap in the live feed lane",
      confidence: "reported",
      reviewState: "approved",
      freshness: "operator_hold",
      meta: {
        note: "Current shipping coverage does not yet support a defensible public throughput cap.",
        mode: "hold"
      }
    });

    insertEvent(db, {
      id: "event_hormuz_context",
      date: "2026-04-24",
      title: "Thousands of seafarers stranded by ongoing blockade on Strait of Hormuz",
      detail: "The blockade keeps ships waiting and leaves the corridor unable to reopen normally.",
      category: "economic",
      tags: ["economic", "entity:strait-of-hormuz", "entity:iran"]
    });

    const suggestions = getTopLineSuggestions(db);
    const hormuz = suggestions.find((item) => item.key === "hormuz_daily_cap");

    expect(hormuz?.status).toBe("reviewed_hold");
    expect(hormuz?.candidate).toBeNull();
    expect(hormuz?.evidence.length).toBeGreaterThan(0);

    db.close();
  });

  it("derives an Iran casualty candidate from combined killed and injured reporting", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_iran_casualty_total",
      date: "2026-04-06",
      title: "IFRC Alert: CHF 40M Emergency Appeal Only 6% Funded",
      detail: "The agency reported 1,900+ people killed and 21,000+ injured in Iran since February 28.",
      category: "humanitarian",
      corroboration: 2,
      sourceText: "Al-Monitor / ICRC / Reuters",
      tags: ["humanitarian", "entity:iran"]
    });

    const suggestions = getTopLineSuggestions(db);
    const casualties = suggestions.find((item) => item.key === "iran_casualties_estimate");

    expect(casualties?.status).toBe("candidate");
    expect(casualties?.candidate?.value).toBe(22900);
    expect(casualties?.candidate?.valueText).toBe("22,900 Iran total casualties");

    db.close();
  });

  it("surfaces an Iran casualty candidate while the metric is on reviewed hold", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    upsertPreparedMetricSnapshot(db, {
      metricKey: "iran_casualties_estimate",
      value: null,
      valueText: "Awaiting reviewed Iran casualty estimate",
      unit: "people",
      timestamp: "2026-04-24T12:00:00.000Z",
      sourceText: "Operator reviewed hold / no defensible current Iran casualty estimate in the live feed lane",
      confidence: "reported",
      reviewState: "approved",
      freshness: "operator_hold",
      meta: {
        note: "Current live coverage does not yet support a defensible public casualty estimate for Iran.",
        mode: "hold"
      }
    });

    insertEvent(db, {
      id: "event_iran_casualty_hold_candidate",
      date: "2026-04-06",
      title: "IFRC Alert: CHF 40M Emergency Appeal Only 6% Funded",
      detail: "The agency reported 1,900+ people killed and 21,000+ injured in Iran since February 28.",
      category: "humanitarian",
      corroboration: 2,
      sourceText: "Al-Monitor / ICRC / Reuters",
      tags: ["humanitarian", "entity:iran"]
    });

    const suggestions = getTopLineSuggestions(db);
    const casualties = suggestions.find((item) => item.key === "iran_casualties_estimate");

    expect(casualties?.status).toBe("candidate");
    expect(casualties?.candidate?.value).toBe(22900);
    expect(casualties?.evidence.length).toBeGreaterThan(0);

    db.close();
  });

  it("derives a Hormuz daily throughput candidate from corroborated weekly transit evidence", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_hormuz_weekly_transits",
      date: "2026-04-24",
      title: "Hormuz: 53 Weekly Transits — War-Era High But 93% Below Normal",
      detail: "Bloomberg's Hormuz tracker recorded 53 vessel transits in the past week, still 93% below the pre-war norm.",
      category: "economic",
      corroboration: 2,
      sourceText: "Bloomberg / Lloyd's List / operator review",
      tags: ["economic", "entity:strait-of-hormuz", "entity:iran"]
    });

    const suggestions = getTopLineSuggestions(db);
    const hormuz = suggestions.find((item) => item.key === "hormuz_daily_cap");

    expect(hormuz?.status).toBe("candidate");
    expect(hormuz?.candidate?.value).toBe(8);
    expect(hormuz?.candidate?.valueText).toBe("~8/day observed");
    expect(hormuz?.candidate?.note).toContain("53 reported weekly Hormuz transits");

    db.close();
  });

  it("does not derive a Hormuz throughput candidate from single-source weekly transit evidence", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_hormuz_weekly_transits_single_source",
      date: "2026-04-24",
      title: "Hormuz: 53 Weekly Transits — War-Era High But 93% Below Normal",
      detail: "One tracker recorded 53 vessel transits in the past week, still 93% below the pre-war norm.",
      category: "economic",
      corroboration: 1,
      sourceText: "Single-source tracker",
      tags: ["economic", "entity:strait-of-hormuz", "entity:iran"]
    });

    const suggestions = getTopLineSuggestions(db);
    const hormuz = suggestions.find((item) => item.key === "hormuz_daily_cap");

    expect(hormuz?.status).toBe("context_only");
    expect(hormuz?.candidate).toBeNull();
    expect(hormuz?.evidence.length).toBeGreaterThan(0);

    db.close();
  });

  it("surfaces a Hormuz candidate from weekly transit evidence even while the metric is on reviewed hold", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    upsertPreparedMetricSnapshot(db, {
      metricKey: "hormuz_daily_cap",
      value: null,
      valueText: "Awaiting reviewed Hormuz daily throughput",
      unit: "ships_per_day",
      timestamp: "2026-04-24T12:00:00.000Z",
      sourceText: "Operator reviewed hold / no defensible current Hormuz daily throughput in the live feed lane",
      confidence: "reported",
      reviewState: "approved",
      freshness: "operator_hold",
      meta: {
        note: "Current shipping coverage is directionally relevant, but it does not yet support a defensible public daily throughput estimate.",
        mode: "hold"
      }
    });

    insertEvent(db, {
      id: "event_hormuz_weekly_transits_hold_candidate",
      date: "2026-04-24",
      title: "Hormuz: 53 Weekly Transits — War-Era High But 93% Below Normal",
      detail: "Bloomberg's Hormuz tracker recorded 53 vessel transits in the past week, still 93% below the pre-war norm.",
      category: "economic",
      corroboration: 2,
      sourceText: "Bloomberg / Lloyd's List / operator review",
      tags: ["economic", "entity:strait-of-hormuz", "entity:iran"]
    });

    const suggestions = getTopLineSuggestions(db);
    const hormuz = suggestions.find((item) => item.key === "hormuz_daily_cap");

    expect(hormuz?.status).toBe("candidate");
    expect(hormuz?.candidate?.value).toBe(8);
    expect(hormuz?.evidence.length).toBeGreaterThan(0);

    db.close();
  });

  it("surfaces a candidate even when the current public metric is still on reviewed hold", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    upsertPreparedMetricSnapshot(db, {
      metricKey: "total_strikes",
      value: null,
      valueText: "Awaiting reviewed cumulative strike total",
      unit: "strikes",
      timestamp: "2026-04-24T12:00:00.000Z",
      sourceText: "Operator reviewed hold / no defensible cumulative strike total in the live feed lane",
      confidence: "reported",
      reviewState: "approved",
      freshness: "operator_hold",
      meta: {
        note: "Current live coverage provides strike context but not a defensible cumulative total for public publication.",
        mode: "hold"
      }
    });

    insertEvent(db, {
      id: "event_total_strikes_hold_candidate",
      date: "2026-04-24",
      title: "Combined campaign crosses 13,420 strikes",
      detail: "Officials say the combined campaign has now exceeded 13,420 strikes across all theaters.",
      category: "us_strike",
      tags: ["us_strike", "entity:united-states", "entity:iran"]
    });

    const suggestions = getTopLineSuggestions(db);
    const strikes = suggestions.find((item) => item.key === "total_strikes");

    expect(strikes?.status).toBe("candidate");
    expect(strikes?.candidate?.value).toBe(13420);
    expect(strikes?.evidence.length).toBeGreaterThan(0);

    db.close();
  });
});
