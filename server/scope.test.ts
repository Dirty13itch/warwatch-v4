import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";
import { openDatabase } from "./db";
import { assessConflictScope, quarantineOutOfScopeFeedEvents } from "./scope";

function makeDb() {
  const config = loadConfig(process.cwd());
  return openDatabase({
    dbPath: ":memory:",
    legacyDir: config.legacyDir,
    blueprintPath: config.blueprintPath
  });
}

describe("mission scope gate", () => {
  it("accepts core Iran-conflict items", () => {
    const assessment = assessConflictScope(
      "Trump extends U.S. ceasefire with Iran as ships remain under threat in the Strait of Hormuz"
    );

    expect(assessment.relevant).toBe(true);
    expect(assessment.band).toBe("core_conflict");
    expect(assessment.matches).toContain("iran");
  });

  it("rejects unrelated general-news items", () => {
    const assessment = assessConflictScope("LIVE: Burnley vs Manchester City - Premier League");

    expect(assessment.relevant).toBe(false);
    expect(assessment.band).toBe("off_scope");
  });

  it("rejects off-domain Iran mentions when they lack conflict context", () => {
    const assessment = assessConflictScope(
      "Iran says fully prepared for football team's World Cup participation"
    );

    expect(assessment.relevant).toBe(false);
    expect(assessment.matches).toContain("iran");
    expect(assessment.matches).toContain("sports");
  });

  it("accepts regional spillover items tied to the same theater", () => {
    const assessment = assessConflictScope(
      "Israeli settlers block Palestinian children from school in the West Bank"
    );

    expect(assessment.relevant).toBe(true);
    expect(assessment.band).toBe("regional_spillover");
  });

  it("quarantines off-scope auto-ingested events and rejects their queue items", () => {
    const db = makeDb();
    const now = "2026-04-22T18:00:00.000Z";
    db.prepare(`
      INSERT INTO events (
        id, date, time, title, detail, category, significance, confidence, corroboration,
        source_text, source_refs_json, review_state, visibility, geo_json, tags_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "event_scope_noise",
      "2026-04-22",
      null,
      "Mexico to beef up security at tourist sites after shooting at pyramids",
      "Unrelated tourism/security story from a general world feed.",
      "intel",
      "medium",
      "unverified",
      1,
      "NPR World",
      JSON.stringify(["NPR World"]),
      "pending",
      "review_only",
      null,
      JSON.stringify(["auto_ingest", "NPR World"]),
      now
    );
    db.prepare(`
      INSERT INTO review_queue (
        id, item_type, item_id, title, severity, reason, status, created_at, updated_at, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "queue_scope_noise",
      "event",
      "event_scope_noise",
      "Mexico to beef up security at tourist sites after shooting at pyramids",
      "critical",
      "Critical auto-ingested event requires human review before public promotion.",
      "pending",
      now,
      now,
      JSON.stringify({ feed: "NPR World" })
    );

    const result = quarantineOutOfScopeFeedEvents(db, "NPR World");
    expect(result.quarantinedEvents).toBe(1);
    expect(result.rejectedQueueItems).toBe(1);

    const eventRow = db.prepare(`SELECT review_state, visibility, tags_json FROM events WHERE id = ?`).get(
      "event_scope_noise"
    ) as { review_state: string; visibility: string; tags_json: string };
    expect(eventRow.review_state).toBe("rejected");
    expect(eventRow.visibility).toBe("review_only");
    expect(JSON.parse(eventRow.tags_json)).toContain("scope_rejected");

    const queueRow = db.prepare(`SELECT status, metadata_json FROM review_queue WHERE id = ?`).get(
      "queue_scope_noise"
    ) as { status: string; metadata_json: string };
    expect(queueRow.status).toBe("rejected");
    expect(JSON.parse(queueRow.metadata_json).scopeRejected).toBe(true);
    db.close();
  });
});
