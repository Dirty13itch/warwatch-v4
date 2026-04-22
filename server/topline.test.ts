import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";
import { openDatabase } from "./db";
import { getTopLineSuggestions } from "./topline";

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
});
