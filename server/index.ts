import { loadConfig } from "./config.js";
import { openDatabase } from "./db.js";
import { createApp } from "./app.js";
import { runIngestionCycle } from "./ingest.js";
import { generateDailyBriefing } from "./briefings.js";

const config = loadConfig();
const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});
const app = createApp(db, config);
const server = app.listen(config.port, () => {
  console.log(`WarWatch API listening on http://localhost:${config.port}`);
});

const timers: NodeJS.Timeout[] = [];
if (config.enableScheduler) {
  timers.push(
    setInterval(() => {
      void runIngestionCycle(db);
    }, 30 * 60 * 1000)
  );
  timers.push(
    setInterval(() => {
      generateDailyBriefing(db);
    }, 12 * 60 * 60 * 1000)
  );
}

function closeGracefully() {
  for (const timer of timers) {
    clearInterval(timer);
  }

  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);

