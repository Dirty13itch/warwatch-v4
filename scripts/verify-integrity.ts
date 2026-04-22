import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";

const root = process.cwd();
const config = loadConfig(root);
const requiredPaths = [
  "AGENTS.md",
  "PROJECT.md",
  "STATUS.md",
  ".agents/TEAM-ROSTER.md",
  "plans/active/coo-operating-system.md",
  "docs/CODEX-STATE.md",
  "docs/CODEX-NEXT-STEPS.md",
  "docs/reference/WARWATCH-V4-BLUEPRINT.md",
  "legacy/warwatch-v3/index.html",
  "legacy/warwatch-v3/js/data.js",
  "client/src/App.tsx",
  "server/app.ts",
  "shared/types.ts"
];

function collectCodeFiles(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectCodeFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

for (const relativePath of requiredPaths) {
  const absolutePath = path.resolve(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required path: ${relativePath}`);
  }
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
    (SELECT COUNT(*) FROM briefings) AS briefings,
    (SELECT COUNT(*) FROM review_queue) AS queue,
    (SELECT COUNT(*) FROM map_features) AS map_features
`).get() as {
  events: number;
  stories: number;
  briefings: number;
  queue: number;
  map_features: number;
};

if (!counts.events || !counts.stories || !counts.briefings || !counts.queue || !counts.map_features) {
  throw new Error(`Unexpected seed counts: ${JSON.stringify(counts)}`);
}

const scannedFiles = [
  ...collectCodeFiles(path.resolve(root, "client/src")),
  ...collectCodeFiles(path.resolve(root, "server"))
];

for (const file of scannedFiles) {
  if (!fs.existsSync(file) || file.includes("legacy")) {
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("window.WW")) {
    throw new Error(`Runtime code still references legacy globals: ${file}`);
  }
}

console.log("integrity-ok");
db.close();
