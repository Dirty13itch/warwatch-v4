import fs from "node:fs";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";

const config = loadConfig();

if (config.dbPath !== ":memory:" && fs.existsSync(config.dbPath)) {
  fs.unlinkSync(config.dbPath);
}

const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});

const counts = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM events) AS events,
    (SELECT COUNT(*) FROM stories) AS stories,
    (SELECT COUNT(*) FROM review_queue) AS queue
`).get() as { events: number; stories: number; queue: number };

console.log(`Rebuilt WarWatch DB at ${config.dbPath}`);
console.log(JSON.stringify(counts, null, 2));
db.close();

