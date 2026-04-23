import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import { upsertPreparedMetricSnapshot } from "../server/ingest.js";
import { generateDailyBriefing } from "../server/briefings.js";
import { buildTopLineHoldInput } from "../shared/topline.js";
import { getTopLineMetrics } from "../server/store.js";

const holdKeys = [
  "total_strikes",
  "hormuz_daily_cap",
  "iran_casualties_estimate"
] as const;

const config = loadConfig(process.cwd());
const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});

try {
  const metrics = getTopLineMetrics(db);
  const lines: string[] = [];

  for (const key of holdKeys) {
    const metric = metrics.find((item) => item.key === key) ?? null;
    const current = metric?.current ?? null;

    if (current && ["live", "ingested", "operator_reviewed"].includes(current.freshness)) {
      lines.push(`- skipped ${key}: current ${current.freshness} snapshot already exists`);
      continue;
    }

    if (current?.freshness === "operator_hold") {
      lines.push(`- skipped ${key}: reviewed hold already active`);
      continue;
    }

    const hold = buildTopLineHoldInput(key);
    const now = new Date().toISOString();
    upsertPreparedMetricSnapshot(db, {
      metricKey: key,
      value: hold.value,
      valueText: hold.valueText,
      unit: metric?.unit ?? null,
      timestamp: now,
      sourceText: hold.sourceText,
      confidence: hold.confidence,
      reviewState: "approved",
      freshness: "operator_hold",
      meta: {
        note: hold.note,
        operatorUpdatedAt: now,
        mode: "hold"
      }
    });

    lines.push(`- published reviewed hold for ${key}`);
  }

  generateDailyBriefing(db);
  console.log(lines.join("\n"));
} finally {
  db.close();
}
