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
    2,
    "Operator Test Feed",
    JSON.stringify(["Operator Test Feed"]),
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
    expect(claim?.status).toBe("new_claim");
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
});
