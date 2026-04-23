import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const snapshotPath = path.resolve(root, "data/public-snapshot.json");
const runningOnVercel = process.env.VERCEL === "1";

if (runningOnVercel && fs.existsSync(snapshotPath)) {
  console.log(`using committed public snapshot -> ${snapshotPath}`);
  process.exit(0);
}

const result = spawnSync(process.execPath, [path.resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/generate-public-snapshot.ts"], {
  cwd: root,
  env: process.env,
  stdio: "inherit"
});

process.exit(result.status ?? 1);
