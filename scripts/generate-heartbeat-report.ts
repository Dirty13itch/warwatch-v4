import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import {
  getBriefings,
  getIngestionRuns,
  getMetricHistory,
  getOverview,
  getTopLineMetrics,
  getReviewQueue,
  getReviewQueueSummary
} from "../server/store.js";

const config = loadConfig();
const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});

function toAsciiArtifact(value: string | null | undefined): string {
  return (value ?? "n/a")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/\u00a0/g, " ")
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "");
}

const overview = getOverview(db);
const queue = getReviewQueue(db);
const queueSummary = getReviewQueueSummary(db);
const runs = getIngestionRuns(db).slice(0, 10);
const briefings = getBriefings(db).slice(0, 1);
const topLineMetrics = getTopLineMetrics(db);
const marketMetrics = [
  ["Brent", "oil_brent"],
  ["WTI", "oil_wti"],
  ["Gold", "gold_price"]
] as const;
const marketLines = marketMetrics.flatMap(([label, key]) => {
  const latest = getMetricHistory(db, key).at(-1);
  if (!latest?.valueText) {
    return [];
  }

  return [
    `- ${label}: ${toAsciiArtifact(latest.valueText)} :: ${latest.freshness} :: ${latest.timestamp}`
  ];
});
const topLineLines = topLineMetrics.map((metric) => {
  const current = metric.current;
  return `- ${metric.label}: ${toAsciiArtifact(current?.valueText ?? "n/a")} :: ${current?.freshness ?? "missing"} :: ${toAsciiArtifact(current?.sourceText ?? "none")} :: ${current?.timestamp ?? "n/a"}`;
});

const lines = [
  "# WarWatch Heartbeat",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Current day: ${overview.currentDay}`,
  `Legacy as of: ${overview.legacyAsOf ?? "n/a"}`,
  `Public stale flag: ${overview.stale ? "YES" : "NO"}`,
  `Top-line freshness: ${overview.freshness.topLine}`,
  `Last successful ingestion: ${overview.freshness.lastSuccessfulIngestionAt ?? "none"}`,
  "",
  "## Top Line",
  ...topLineLines,
  "",
  "## Queue",
  `- Pending ${queueSummary.pending} | Critical ${queueSummary.critical} | >24h ${queueSummary.olderThan24h} | >72h ${queueSummary.olderThan72h} | Oldest ${queueSummary.oldestPendingHours === null ? "n/a" : `${(queueSummary.oldestPendingHours / 24).toFixed(1)}d`}`,
  ...queue
    .slice(0, 6)
    .map((item) => `- [${item.severity}] ${toAsciiArtifact(item.title)} :: ${item.status}`),
  "",
  "## Markets",
  ...(marketLines.length ? marketLines : ["- No live market metrics ingested yet"]),
  "",
  "## Ingestion",
  ...runs.map(
    (run) =>
      `- ${toAsciiArtifact(run.feedName)}: ${run.status} | inserted=${run.insertedCount} queued=${run.queuedCount} | ${toAsciiArtifact(run.summary)}`
  ),
  "",
  "## Briefings",
  ...briefings.map(
    (briefing) =>
      `- ${toAsciiArtifact(briefing.title)} (${briefing.briefingDate}) :: ${briefing.reviewState}`
  ),
  "",
  "## Next Actions",
  "- Reduce pending critical queue items before promoting fresh top-line claims",
  "- Keep live ingestion healthy and visible in operator surfaces",
  "- Maintain docs and state surfaces when runtime truth changes"
];

fs.mkdirSync(path.dirname(config.heartbeatReportPath), { recursive: true });
fs.writeFileSync(config.heartbeatReportPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote heartbeat report to ${config.heartbeatReportPath}`);
db.close();
