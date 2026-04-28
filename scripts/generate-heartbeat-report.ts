import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import { publicSiteProductionUrl } from "../shared/public-site.js";
import {
  getBriefings,
  getIngestionRuns,
  getMetricHistory,
  getOverview,
  getTopLineMetrics,
  getReviewQueue,
  getReviewQueueSummary
} from "../server/store.js";

type BuildReport = {
  generatedAt: string;
  totals: {
    jsBytes: number;
    cssBytes: number;
    htmlBytes: number;
  };
  oversizedAssets: Array<{
    file: string;
    bytes: number;
    gzipBytes: number;
  }>;
  topAssets: Array<{
    file: string;
    bytes: number;
    gzipBytes: number;
  }>;
};

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

function humanBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["kB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

const overview = getOverview(db);
const queue = getReviewQueue(db);
const queueSummary = getReviewQueueSummary(db);
const runs = getIngestionRuns(db).slice(0, 10);
const briefings = getBriefings(db).slice(0, 1);
const topLineMetrics = getTopLineMetrics(db);
const buildReportPath = path.resolve(config.rootDir, "reports/build/LATEST.json");
const buildReport = fs.existsSync(buildReportPath)
  ? (JSON.parse(fs.readFileSync(buildReportPath, "utf8")) as BuildReport)
  : null;
const deployedPublicBaseUrl = config.publicBaseUrl || publicSiteProductionUrl;
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
const nextActions = [
  queueSummary.pending > 0
    ? "- Reduce pending critical queue items before promoting fresh top-line claims"
    : overview.stale
      ? "- Pending critical queue is clear; next unlock is reviewed current top-line metrics or an explicit evidence-bound hold state"
      : "- Public stale flag is clear; next leverage is build-weight reduction and stronger preview regression scoring",
  overview.stale
    ? "- Clear the remaining stale public KPI lane only where current evidence is defensible"
    : "- Keep reviewed public top-line metrics fresh as new evidence lands",
  !deployedPublicBaseUrl
    ? "- Set a stable PUBLIC_BASE_URL so live public verification stops skipping"
    : "- Keep live public verification green on the deployed surface",
  "- Keep live ingestion healthy and visible in operator surfaces",
  "- Maintain docs and state surfaces when runtime truth changes"
];

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
  "## Build",
  ...(buildReport
    ? [
        `- JS ${humanBytes(buildReport.totals.jsBytes)} | CSS ${humanBytes(buildReport.totals.cssBytes)} | Oversized ${buildReport.oversizedAssets.length}`,
        ...buildReport.topAssets
          .slice(0, 3)
          .map((item) => `- ${item.file}: ${humanBytes(item.bytes)} :: gzip ${humanBytes(item.gzipBytes)}`)
      ]
    : ["- No build artifact generated yet"]),
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
  ...nextActions
];

fs.mkdirSync(path.dirname(config.heartbeatReportPath), { recursive: true });
fs.writeFileSync(config.heartbeatReportPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote heartbeat report to ${config.heartbeatReportPath}`);
db.close();
