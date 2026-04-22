import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";
import { openDatabase } from "./db";
import { generateDailyBriefing } from "./briefings";
import { upsertPreparedMetricSnapshot } from "./ingest";

function makeDb() {
  const config = loadConfig(process.cwd());
  return openDatabase({
    dbPath: ":memory:",
    legacyDir: config.legacyDir,
    blueprintPath: config.blueprintPath
  });
}

describe("daily briefing generation", () => {
  it("includes live market signals when ingested metrics exist", () => {
    const db = makeDb();
    const timestamp = "2026-04-22T04:00:00.000Z";

    upsertPreparedMetricSnapshot(db, {
      metricKey: "oil_brent",
      value: 102.01,
      valueText: "$102.01",
      unit: "usd_per_barrel",
      timestamp,
      sourceText: "Yahoo Finance",
      confidence: "confirmed",
      reviewState: "approved",
      freshness: "ingested",
      meta: { symbol: "BZ=F", currency: "USD" }
    });
    upsertPreparedMetricSnapshot(db, {
      metricKey: "oil_brent",
      value: 98.48,
      valueText: "$98.48",
      unit: "usd_per_barrel",
      timestamp: "2026-04-21T04:00:00.000Z",
      sourceText: "Yahoo Finance",
      confidence: "confirmed",
      reviewState: "approved",
      freshness: "ingested",
      meta: { symbol: "BZ=F", currency: "USD" }
    });
    upsertPreparedMetricSnapshot(db, {
      metricKey: "oil_wti",
      value: 93.46,
      valueText: "$93.46",
      unit: "usd_per_barrel",
      timestamp,
      sourceText: "Yahoo Finance",
      confidence: "confirmed",
      reviewState: "approved",
      freshness: "ingested",
      meta: { symbol: "CL=F", currency: "USD" }
    });
    upsertPreparedMetricSnapshot(db, {
      metricKey: "oil_wti",
      value: 92.13,
      valueText: "$92.13",
      unit: "usd_per_barrel",
      timestamp: "2026-04-21T04:00:00.000Z",
      sourceText: "Yahoo Finance",
      confidence: "confirmed",
      reviewState: "approved",
      freshness: "ingested",
      meta: { symbol: "CL=F", currency: "USD" }
    });
    upsertPreparedMetricSnapshot(db, {
      metricKey: "gold_price",
      value: 4744.4,
      valueText: "$4,744.40",
      unit: "usd_per_ounce",
      timestamp,
      sourceText: "Yahoo Finance",
      confidence: "confirmed",
      reviewState: "approved",
      freshness: "ingested",
      meta: { symbol: "GC=F", currency: "USD" }
    });
    upsertPreparedMetricSnapshot(db, {
      metricKey: "gold_price",
      value: 4698.4,
      valueText: "$4,698.40",
      unit: "usd_per_ounce",
      timestamp: "2026-04-21T04:00:00.000Z",
      sourceText: "Yahoo Finance",
      confidence: "confirmed",
      reviewState: "approved",
      freshness: "ingested",
      meta: { symbol: "GC=F", currency: "USD" }
    });

    const id = generateDailyBriefing(db, "2026-04-22");
    const row = db.prepare(`SELECT body FROM briefings WHERE id = ?`).get(id) as {
      body: string;
    };

    expect(row.body).toContain("Market signals: Brent $102.01");
    expect(row.body).toContain("WTI $93.46");
    expect(row.body).toContain("Gold $4,744.40");
    db.close();
  });
});
