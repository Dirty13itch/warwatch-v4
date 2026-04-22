import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import {
  getBriefings,
  getIngestionRuns,
  getOverview,
  getReviewQueue
} from "../server/store.js";

const config = loadConfig();
const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});

const overview = getOverview(db);
const queue = getReviewQueue(db);
const runs = getIngestionRuns(db).slice(0, 5);
const briefings = getBriefings(db).slice(0, 1);

const lines = [
  "# WarWatch Heartbeat",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Current day: ${overview.currentDay}`,
  `Legacy as of: ${overview.legacyAsOf ?? "n/a"}`,
  `Public stale flag: ${overview.stale ? "YES" : "NO"}`,
  "",
  "## Queue",
  ...queue.slice(0, 6).map((item) => `- [${item.severity}] ${item.title} :: ${item.status}`),
  "",
  "## Ingestion",
  ...runs.map(
    (run) =>
      `- ${run.feedName}: ${run.status} | inserted=${run.insertedCount} queued=${run.queuedCount} | ${run.summary}`
  ),
  "",
  "## Briefings",
  ...briefings.map((briefing) => `- ${briefing.title} (${briefing.briefingDate}) :: ${briefing.reviewState}`),
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

