import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import { upsertPreparedMetricSnapshot } from "../server/ingest.js";
import { generateDailyBriefing } from "../server/briefings.js";
import { getTopLineSuggestions } from "../server/topline.js";
import { getTopLineMetrics } from "../server/store.js";
import { getTopLineMetricDefinition, isTopLineMetricKey } from "../shared/topline.js";

const keyArg = process.argv[2];

if (!keyArg || !isTopLineMetricKey(keyArg)) {
  console.error("Usage: npm run review:publish-candidate -- <metric-key>");
  process.exit(1);
}

const config = loadConfig(process.cwd());
const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});

try {
  const metric = getTopLineMetrics(db).find((item) => item.key === keyArg) ?? null;
  const suggestion = getTopLineSuggestions(db).find((item) => item.key === keyArg) ?? null;

  if (!metric) {
    console.error(`Metric not found: ${keyArg}`);
    process.exit(1);
  }

  if (!suggestion?.candidate || suggestion.status !== "candidate") {
    console.error(`No publishable candidate currently exists for ${keyArg}. Current suggestion status: ${suggestion?.status ?? "missing"}`);
    process.exit(1);
  }

  const definition = getTopLineMetricDefinition(keyArg);
  const now = new Date().toISOString();
  upsertPreparedMetricSnapshot(db, {
    metricKey: keyArg,
    value: suggestion.candidate.value,
    valueText: suggestion.candidate.valueText,
    unit: definition.unit,
    timestamp: now,
    sourceText: suggestion.candidate.sourceText,
    confidence: suggestion.candidate.confidence,
    reviewState: "approved",
    freshness: "operator_reviewed",
    meta: {
      note: suggestion.candidate.note,
      operatorUpdatedAt: now,
      mode: "publish",
      publishedFromSuggestion: true
    }
  });

  generateDailyBriefing(db);
  console.log(`published ${keyArg}: ${suggestion.candidate.valueText}`);
} finally {
  db.close();
}
