import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const isLiveMode = process.argv.includes("--live");
const latestDir = path.resolve(rootDir, isLiveMode ? "reports/previews/live/latest" : "reports/previews/latest");

const targets = {
  html: {
    label: "HTML atlas",
    filePath: path.join(latestDir, "index.html")
  },
  pdf: {
    label: "PDF atlas",
    filePath: path.join(latestDir, "preview-atlas.pdf")
  },
  board: {
    label: "Preview board",
    filePath: path.join(latestDir, "preview-board.png")
  }
} as const;

type TargetKey = keyof typeof targets;

function openPath(filePath: string) {
  if (process.platform === "win32") {
    const escaped = filePath.replace(/'/g, "''");
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-Command", `Start-Process -LiteralPath '${escaped}'`],
      {
        detached: true,
        stdio: "ignore"
      }
    );
    child.unref();
    return;
  }

  if (process.platform === "darwin") {
    const child = spawn("open", [filePath], {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    return;
  }

  const child = spawn("xdg-open", [filePath], {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}

function printAvailableTargets() {
  console.log("Available preview artifacts:");
  for (const [key, value] of Object.entries(targets)) {
    const exists = fs.existsSync(value.filePath);
    console.log(`- ${key}: ${value.filePath}${exists ? "" : " (missing)"}`);
  }
}

function main() {
  const args = process.argv.slice(2).filter((value) => value !== "--live");
  const requested = (args[0] ?? "html") as TargetKey;
  const target = targets[requested];

  if (!target) {
    console.error(`Unknown preview target: ${requested}`);
    printAvailableTargets();
    process.exit(1);
  }

  if (!fs.existsSync(target.filePath)) {
    console.error(`Preview artifact is missing: ${target.filePath}`);
    console.error(`Run \`npm run ${isLiveMode ? "preview:live" : "preview:shots"}\` first.`);
    printAvailableTargets();
    process.exit(1);
  }

  openPath(target.filePath);
  console.log(`Opened ${target.label}: ${target.filePath}`);
  printAvailableTargets();
}

main();
