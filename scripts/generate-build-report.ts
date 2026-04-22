import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadConfig } from "../server/config.js";

type AssetType = "js" | "css" | "html" | "other";

type BuildAssetSummary = {
  file: string;
  type: AssetType;
  bytes: number;
  gzipBytes: number;
};

type BuildReport = {
  generatedAt: string;
  clientDir: string;
  totals: {
    jsBytes: number;
    cssBytes: number;
    htmlBytes: number;
  };
  oversizedAssets: BuildAssetSummary[];
  topAssets: BuildAssetSummary[];
};

const config = loadConfig();
const clientDir = path.resolve(config.rootDir, "dist/client");
const reportDir = path.resolve(config.rootDir, "reports/build");
const reportJsonPath = path.join(reportDir, "LATEST.json");
const reportMarkdownPath = path.join(reportDir, "LATEST.md");

function listFilesRecursive(rootDir: string): string[] {
  return fs.readdirSync(rootDir, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      return listFilesRecursive(nextPath);
    }

    return [nextPath];
  });
}

function assetTypeForFile(filePath: string): AssetType {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".js") {
    return "js";
  }
  if (extension === ".css") {
    return "css";
  }
  if (extension === ".html") {
    return "html";
  }

  return "other";
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

if (!fs.existsSync(clientDir)) {
  throw new Error(`Missing built client directory: ${clientDir}`);
}

const assets = listFilesRecursive(clientDir)
  .map((filePath) => {
    const content = fs.readFileSync(filePath);
    return {
      file: path.relative(clientDir, filePath).replace(/\\/g, "/"),
      type: assetTypeForFile(filePath),
      bytes: content.byteLength,
      gzipBytes: zlib.gzipSync(content).byteLength
    } satisfies BuildAssetSummary;
  })
  .sort((left, right) => right.bytes - left.bytes);

const report: BuildReport = {
  generatedAt: new Date().toISOString(),
  clientDir,
  totals: {
    jsBytes: assets.filter((item) => item.type === "js").reduce((total, item) => total + item.bytes, 0),
    cssBytes: assets.filter((item) => item.type === "css").reduce((total, item) => total + item.bytes, 0),
    htmlBytes: assets.filter((item) => item.type === "html").reduce((total, item) => total + item.bytes, 0)
  },
  oversizedAssets: assets.filter((item) => item.bytes >= 500 * 1024),
  topAssets: assets.slice(0, 6)
};

const lines = [
  "# WarWatch Build Report",
  "",
  `Generated: ${report.generatedAt}`,
  `Client dir: ${report.clientDir}`,
  "",
  "## Totals",
  `- JavaScript: ${humanBytes(report.totals.jsBytes)}`,
  `- CSS: ${humanBytes(report.totals.cssBytes)}`,
  `- HTML: ${humanBytes(report.totals.htmlBytes)}`,
  "",
  "## Oversized Assets",
  ...(report.oversizedAssets.length
    ? report.oversizedAssets.map(
        (item) => `- ${item.file}: ${humanBytes(item.bytes)} :: gzip ${humanBytes(item.gzipBytes)}`
      )
    : ["- None"]),
  "",
  "## Top Assets",
  ...report.topAssets.map(
    (item) => `- ${item.file}: ${humanBytes(item.bytes)} :: gzip ${humanBytes(item.gzipBytes)}`
  )
];

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(reportMarkdownPath, `${lines.join("\n")}\n`, "utf8");

console.log(`Wrote build report to ${reportMarkdownPath}`);
