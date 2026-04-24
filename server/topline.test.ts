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
