import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";
import { openDatabase } from "./db";
import { entityTagsForText } from "../shared/entity-matching";
import type { EntityRecord } from "../shared/types";
import {
  extractYahooMetricSnapshots,
  upsertPreparedFeedEvent,
  upsertPreparedMetricSnapshot
} from "./ingest";
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
    const entities = db.prepare(`SELECT * FROM entities ORDER BY name ASC`).all() as unknown as EntityRecord[];
    const detail = "Fresh corroborating wire copy for the opening strike wave against Iran and Hezbollah.";
    const result = upsertPreparedFeedEvent(db, {
      eventDate: "2026-02-28",
      title: "Operation Epic Fury / Roaring Lion Launches",
      detail,
      category: "us_strike",
      significance: "critical",
      feedName: "Fresh Wire",
      link: "https://example.com/opening-strike",
      entityTags: entityTagsForText(entities, "Operation Epic Fury / Roaring Lion Launches", detail, "Fresh Wire"),
      createdAt: "2026-04-22T16:00:00.000Z"
    });

    expect(result.action).toBe("merged");

    const row = db.prepare(`
      SELECT corroboration, source_text, source_refs_json, tags_json
      FROM events
      WHERE title = 'Operation Epic Fury / Roaring Lion Launches'
    `).get() as {
      corroboration: number;
      source_text: string;
      source_refs_json: string;
      tags_json: string;
    };

    expect(row.corroboration).toBeGreaterThan(1);
    expect(row.source_text).toContain("Fresh Wire");
    expect(JSON.parse(row.source_refs_json)).toContain("Fresh Wire");
    expect(JSON.parse(row.tags_json)).toEqual(expect.arrayContaining(["entity:iran", "entity:hezbollah"]));
    db.close();
  });

  it("persists canonical entity tags on newly inserted feed events", () => {
    const db = makeDb();
    const entities = db.prepare(`SELECT * FROM entities ORDER BY name ASC`).all() as unknown as EntityRecord[];
    const title = "Strait of Hormuz corridor capped at 18 ships per day";
    const detail = "Iran shipping pressure keeps the Strait of Hormuz corridor capped at 18 ships per day.";
    const entityTags = entityTagsForText(entities, title, detail, "Operator Test Feed");

    expect(entityTags).toEqual(expect.arrayContaining(["entity:iran", "entity:strait-of-hormuz"]));

    const result = upsertPreparedFeedEvent(db, {
      eventDate: "2026-04-22",
      title,
      detail,
      category: "economic",
      significance: "high",
      feedName: "Operator Test Feed",
      link: null,
      entityTags,
      createdAt: "2026-04-22T18:00:00.000Z"
    });

    expect(result.action).toBe("inserted");

    const row = db.prepare(`
      SELECT tags_json
      FROM events
      WHERE title = ?
    `).get(title) as {
      tags_json: string;
    };

    expect(JSON.parse(row.tags_json)).toEqual(
      expect.arrayContaining(["auto_ingest", "Operator Test Feed", "entity:iran", "entity:strait-of-hormuz"])
    );
    db.close();
  });

  it("extracts Yahoo chart payloads into ingested market snapshots", () => {
    const snapshots = extractYahooMetricSnapshots(
      {
        feedName: "Yahoo Finance Brent",
        metricKey: "oil_brent",
        symbol: "BZ=F",
        unit: "usd_per_barrel",
        decimals: 2
      },
      {
        chart: {
          result: [
            {
              meta: {
                currency: "USD",
                exchangeName: "NYM",
                symbol: "BZ=F"
              },
              timestamp: [1776806400, 1776892800],
              indicators: {
                quote: [
                  {
                    close: [91.25, 93.31]
                  }
                ]
              }
            }
          ]
        }
      }
    );

    expect(snapshots).toHaveLength(2);
    expect(snapshots[1].metricKey).toBe("oil_brent");
    expect(snapshots[1].valueText).toBe("$93.31");
    expect(snapshots[1].freshness).toBe("ingested");
  });

  it("upserts ingested market snapshots so overview KPIs can refresh without falsely clearing the stale flag", () => {
    const db = makeDb();
    const result = upsertPreparedMetricSnapshot(db, {
      metricKey: "oil_brent",
      value: 93.31,
      valueText: "$93.31",
      unit: "usd_per_barrel",
      timestamp: "2026-04-22T18:00:00.000Z",
      sourceText: "Yahoo Finance",
      confidence: "confirmed",
      reviewState: "approved",
      freshness: "ingested",
      meta: {
        symbol: "BZ=F",
        currency: "USD"
      }
    });

    expect(result.action).toBe("inserted");

    const overview = getOverview(db);
    const oil = overview.kpis.find((item) => item.key === "oil_brent");
    expect(oil?.value).toBe("$93.31");
    expect(oil?.freshness).toBe("ingested");
    expect(overview.stale).toBe(true);
    db.close();
  });
});
