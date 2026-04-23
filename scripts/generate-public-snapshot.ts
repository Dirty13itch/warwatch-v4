import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import { buildPublicSnapshot } from "../server/public-snapshot-builder.js";
import { getPublicSnapshotPath } from "../server/public-snapshot.js";

const config = loadConfig();
const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});

try {
  const snapshot = buildPublicSnapshot(db);
  const snapshotPath = getPublicSnapshotPath(config.rootDir);
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`public-snapshot ok -> ${snapshotPath}`);
} finally {
  db.close();
}
