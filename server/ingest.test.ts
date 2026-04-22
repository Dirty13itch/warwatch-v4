import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";
import { openDatabase } from "./db";
import { upsertPreparedFeedEvent } from "./ingest";
import { getOverview } from "./store";

function makeDb() {
  const config = loadConfig(process.cwd());
  return openDatabase({
    dbPath: ":memory:",
    legacyDir: config.legacyDir,
    blueprintPath: config.blueprintPath
  });
}

describe("ingestion merge behavior", () => {
  it("marks the seeded public surface as stale until top-line data becomes live", () => {
    const db = makeDb();
    const overview = getOverview(db);
    expect(overview.stale).toBe(true);
    expect(overview.freshness.topLine).toBe("stale_seed");
    db.close();
  });

  it("merges corroborating RSS items into an existing event instead of inserting duplicates", () => {
    const db = makeDb();
    const result = upsertPreparedFeedEvent(db, {
      eventDate: "2026-02-28",
      title: "Operation Epic Fury / Roaring Lion Launches",
      detail: "Fresh corroborating wire copy for the opening strike wave.",
      category: "us_strike",
      significance: "critical",
      feedName: "Fresh Wire",
      link: "https://example.com/opening-strike",
      createdAt: "2026-04-22T16:00:00.000Z"
    });

    expect(result.action).toBe("merged");

    const row = db.prepare(`
      SELECT corroboration, source_text, source_refs_json
      FROM events
      WHERE title = 'Operation Epic Fury / Roaring Lion Launches'
    `).get() as {
      corroboration: number;
      source_text: string;
      source_refs_json: string;
    };

    expect(row.corroboration).toBeGreaterThan(1);
    expect(row.source_text).toContain("Fresh Wire");
    expect(JSON.parse(row.source_refs_json)).toContain("Fresh Wire");
    db.close();
  });
});

