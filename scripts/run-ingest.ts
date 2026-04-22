import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import { runIngestionCycle } from "../server/ingest.js";
import { generateDailyBriefing } from "../server/briefings.js";

const config = loadConfig();
const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});

await runIngestionCycle(db);
const briefingId = generateDailyBriefing(db);
const lastRuns = db.prepare(`
  SELECT feed_name, status, inserted_count, queued_count
  FROM ingestion_runs
  ORDER BY started_at DESC
  LIMIT 6
`).all();

console.log(`Generated or reused briefing ${briefingId}`);
console.log(JSON.stringify(lastRuns, null, 2));
db.close();

