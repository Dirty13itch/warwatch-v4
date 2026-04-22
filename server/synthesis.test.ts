import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";
import { openDatabase } from "./db";
import { getSynthesisSuggestions } from "./synthesis";

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
    significance?: string;
    tags?: string[];
    sourceText?: string;
    corroboration?: number;
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
    input.significance ?? "high",
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

describe("operator synthesis suggestions", () => {
  it("promotes graph-aware story and claim candidates from recent evidence", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_hormuz_story",
      date: "2026-04-22",
      title: "Strait of Hormuz corridor capped at 18 ships per day",
      detail: "Iran shipping pressure keeps the Strait of Hormuz corridor capped at 18 ships per day.",
      category: "economic",
      tags: ["economic", "entity:iran", "entity:strait-of-hormuz"]
    });

    const suggestions = getSynthesisSuggestions(db);
    const story = suggestions.stories.find((item) => item.entityKeys.includes("entity:strait-of-hormuz"));
    const claim = suggestions.claims.find((item) => item.title === "Hormuz Shipping Constraint");

    expect(story?.suggestedSection).toBe("indicator");
    expect(story?.status).toBe("update_story");
    expect(story?.matchedStoryTitle).toBeTruthy();
    expect(story?.eventCount).toBe(1);
    expect(claim?.status).toBe("new_claim");
    expect(claim?.sourceCount).toBe(1);
    expect(claim?.evidence[0]?.eventId).toBe("event_hormuz_story");

    db.close();
  });

  it("maps ceasefire evidence back into the existing canonical claim lane", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_ceasefire",
      date: "2026-04-22",
      title: "Ceasefire deadline talks stall again",
      detail: "Iran and Israel negotiators are still in ceasefire talks, but the deadline track is under pressure again.",
      category: "diplomatic",
      significance: "critical",
      tags: ["diplomatic", "entity:iran", "entity:israel"]
    });

    const suggestions = getSynthesisSuggestions(db);
    const claim = suggestions.claims.find((item) => item.title === "Ceasefire / Deadline Status");

    expect(claim?.status).toBe("update_claim");
    expect(claim?.matchedClaimTitle).toBe("Ceasefire / Deadline Status");

    db.close();
  });

  it("clusters related evidence into one stronger synthesis candidate", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_hormuz_cluster_1",
      date: "2026-04-22",
      title: "Strait of Hormuz corridor capped at 18 ships per day",
      detail: "Iran shipping pressure keeps the Strait of Hormuz corridor capped at 18 ships per day.",
      category: "economic",
      sourceText: "Operator Test Feed / Reuters",
      tags: ["economic", "entity:iran", "entity:strait-of-hormuz"]
    });

    insertEvent(db, {
      id: "event_hormuz_cluster_2",
      date: "2026-04-21",
      title: "Hormuz shipping corridor remains constrained",
      detail: "Commercial routing advisories say Strait of Hormuz traffic is still constrained after the latest warning cycle.",
      category: "economic",
      significance: "critical",
      sourceText: "Lloyd's List / Operator Test Feed",
      corroboration: 3,
      tags: ["economic", "entity:iran", "entity:strait-of-hormuz"]
    });

    const suggestions = getSynthesisSuggestions(db);
    const claim = suggestions.claims.find((item) => item.title === "Hormuz Shipping Constraint");

    expect(claim?.eventCount).toBe(2);
    expect(claim?.sourceCount).toBeGreaterThanOrEqual(2);
    expect(claim?.evidence.length).toBe(2);
    expect(claim?.rationale).toContain("2 events");

    db.close();
  });

  it("drops stale evidence outside the active synthesis window", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_hormuz_recent",
      date: "2026-04-22",
      title: "Hormuz transit corridor remains constrained",
      detail: "Commercial advisories say the Strait of Hormuz remains constrained after the latest warning cycle.",
      category: "economic",
      sourceText: "Reuters / Operator Test Feed",
      tags: ["economic", "entity:iran", "entity:strait-of-hormuz"]
    });

    insertEvent(db, {
      id: "event_hormuz_old",
      date: "2026-03-20",
      title: "Hormuz transit corridor remains constrained",
      detail: "Older shipping advisories also described a constrained Strait of Hormuz corridor.",
      category: "economic",
      sourceText: "Lloyd's List / Operator Test Feed",
      tags: ["economic", "entity:iran", "entity:strait-of-hormuz"]
    });

    const suggestions = getSynthesisSuggestions(db);
    const claim = suggestions.claims.find((item) => item.title === "Hormuz Shipping Constraint");

    expect(claim?.eventCount).toBe(1);
    expect(claim?.evidence[0]?.eventId).toBe("event_hormuz_recent");

    db.close();
  });

  it("splits unrelated threat-level topics into separate candidate lanes", () => {
    const db = makeDb();
    db.exec("DELETE FROM events;");

    insertEvent(db, {
      id: "event_threat_airframe",
      date: "2026-04-22",
      title: "A-10 Thunderbolt II downed near Strait of Hormuz",
      detail: "An A-10 Thunderbolt II was downed near the Strait of Hormuz during a rescue operation.",
      category: "air_strike",
      significance: "critical",
      sourceText: "Operator Test Feed / Reuters",
      tags: ["air_strike", "entity:iran", "entity:strait-of-hormuz", "entity:united-states"]
    });

    insertEvent(db, {
      id: "event_threat_maritime",
      date: "2026-04-22",
      title: "Hezbollah anti-ship cruise missile strikes Israeli warship",
      detail: "Hezbollah fired an anti-ship cruise missile at an Israeli naval vessel operating in Lebanese coastal waters.",
      category: "cross_border_strike",
      significance: "critical",
      sourceText: "Operator Test Feed / AP",
      tags: ["cross_border_strike", "entity:hezbollah", "entity:israel", "entity:lebanon"]
    });

    const suggestions = getSynthesisSuggestions(db);
    const threatLanes = suggestions.claims.filter((item) => item.title === "Threat Level");

    expect(threatLanes.length).toBeGreaterThanOrEqual(2);
    expect(threatLanes.every((item) => item.eventCount === 1)).toBe(true);

    db.close();
  });
});
