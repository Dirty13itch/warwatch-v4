import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const rootDir = process.cwd();
const previewRoot = path.resolve(rootDir, "reports/previews");
const localLatestDir = path.join(previewRoot, "latest");
const livePreviewRoot = path.join(previewRoot, "live");
const liveLatestDir = path.join(livePreviewRoot, "latest");
const compareReportPath = path.join(previewRoot, "DIFF-LATEST.md");
const compareJsonPath = path.join(previewRoot, "DIFF-LATEST.json");
const snapshotPath = path.join(rootDir, "data/public-snapshot.json");

type FileComparison = {
  fileName: string;
  localBytes: number;
  liveBytes: number;
  localSha1: string;
  liveSha1: string;
  identical: boolean;
};

type TruthParity = {
  matches: boolean;
  headlineLocal: string | null;
  headlineLive: string | null;
  topLineFreshnessLocal: string | null;
  topLineFreshnessLive: string | null;
  kpis: Array<{
    key: string;
    localValue: string | null;
    localFreshness: string | null;
    liveValue: string | null;
    liveFreshness: string | null;
    matches: boolean;
  }>;
  error?: string;
};

function sha1ForFile(filePath: string): string {
  return crypto.createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
}

function listComparableCaptureFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((fileName) => fileName.endsWith(".png"))
    .sort((left, right) => left.localeCompare(right));
}

function compareCaptureFiles(): {
  comparable: FileComparison[];
  localOnly: string[];
  liveOnly: string[];
} {
  const localFiles = listComparableCaptureFiles(localLatestDir);
  const liveFiles = listComparableCaptureFiles(liveLatestDir);
  const localSet = new Set(localFiles);
  const liveSet = new Set(liveFiles);

  const comparable = localFiles
    .filter((fileName) => liveSet.has(fileName))
    .map((fileName) => {
      const localPath = path.join(localLatestDir, fileName);
      const livePath = path.join(liveLatestDir, fileName);
      const localBytes = fs.statSync(localPath).size;
      const liveBytes = fs.statSync(livePath).size;
      const localSha1 = sha1ForFile(localPath);
      const liveSha1 = sha1ForFile(livePath);
      return {
        fileName,
        localBytes,
        liveBytes,
        localSha1,
        liveSha1,
        identical: localSha1 === liveSha1
      };
    });

  const localOnly = localFiles.filter((fileName) => !liveSet.has(fileName));
  const liveOnly = liveFiles.filter((fileName) => !localSet.has(fileName));

  return {
    comparable,
    localOnly,
    liveOnly
  };
}

function toLookup<T extends { key: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.key, item]));
}

async function compareTruthParity(): Promise<TruthParity> {
  const publicBaseUrl = (process.env.PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (!publicBaseUrl) {
    return {
      matches: false,
      headlineLocal: null,
      headlineLive: null,
      topLineFreshnessLocal: null,
      topLineFreshnessLive: null,
      kpis: [],
      error: "PUBLIC_BASE_URL is not set."
    };
  }

  if (!fs.existsSync(snapshotPath)) {
    return {
      matches: false,
      headlineLocal: null,
      headlineLive: null,
      topLineFreshnessLocal: null,
      topLineFreshnessLive: null,
      kpis: [],
      error: "Committed public snapshot is missing."
    };
  }

  try {
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as {
      overview: {
        headline: { description: string };
        freshness: { topLine: string | null };
        kpis: Array<{ key: string; value: string; freshness: string | null }>;
      };
    };

    const response = await fetch(`${publicBaseUrl}/api/overview`);
    if (!response.ok) {
      throw new Error(`Live overview returned ${response.status}`);
    }

    const liveOverview = (await response.json()) as {
      headline: { description: string };
      freshness: { topLine: string | null };
      kpis: Array<{ key: string; value: string; freshness: string | null }>;
    };

    const localKpis = toLookup(snapshot.overview.kpis);
    const liveKpis = toLookup(liveOverview.kpis);
    const allKeys = Array.from(new Set([...localKpis.keys(), ...liveKpis.keys()])).sort((left, right) =>
      left.localeCompare(right)
    );

    const kpis = allKeys.map((key) => {
      const local = localKpis.get(key);
      const live = liveKpis.get(key);
      const matches =
        (local?.value ?? null) === (live?.value ?? null) &&
        (local?.freshness ?? null) === (live?.freshness ?? null);
      return {
        key,
        localValue: local?.value ?? null,
        localFreshness: local?.freshness ?? null,
        liveValue: live?.value ?? null,
        liveFreshness: live?.freshness ?? null,
        matches
      };
    });

    const headlineLocal = snapshot.overview.headline.description;
    const headlineLive = liveOverview.headline.description;
    const topLineFreshnessLocal = snapshot.overview.freshness.topLine;
    const topLineFreshnessLive = liveOverview.freshness.topLine;
    const matches =
      headlineLocal === headlineLive &&
      topLineFreshnessLocal === topLineFreshnessLive &&
      kpis.every((item) => item.matches);

    return {
      matches,
      headlineLocal,
      headlineLive,
      topLineFreshnessLocal,
      topLineFreshnessLive,
      kpis
    };
  } catch (error) {
    return {
      matches: false,
      headlineLocal: null,
      headlineLive: null,
      topLineFreshnessLocal: null,
      topLineFreshnessLive: null,
      kpis: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function writeCompareArtifacts(input: {
  comparisons: FileComparison[];
  localOnly: string[];
  liveOnly: string[];
  truthParity: TruthParity;
}) {
  const drifted = input.comparisons.filter((item) => !item.identical);
  const identical = input.comparisons.filter((item) => item.identical);
  const json = {
    generatedAt: new Date().toISOString(),
    comparableCount: input.comparisons.length,
    identicalCount: identical.length,
    driftedCount: drifted.length,
    localOnlyCount: input.localOnly.length,
    liveOnlyCount: input.liveOnly.length,
    comparisons: input.comparisons,
    localOnly: input.localOnly,
    liveOnly: input.liveOnly,
    truthParity: input.truthParity
  };

  const lines = [
    "# WarWatch Preview Drift Report",
    "",
    `Generated: ${json.generatedAt}`,
    `Local atlas: ${path.join(localLatestDir, "index.html")}`,
    `Live atlas: ${path.join(liveLatestDir, "index.html")}`,
    "",
    "## Capture Summary",
    `- Comparable captures: ${json.comparableCount}`,
    `- Identical captures: ${json.identicalCount}`,
    `- Drifted captures: ${json.driftedCount}`,
    `- Local-only captures: ${json.localOnlyCount}`,
    `- Live-only captures: ${json.liveOnlyCount}`,
    "",
    "## Public Truth Parity"
  ];

  if (input.truthParity.error) {
    lines.push(`- Error: ${input.truthParity.error}`);
  } else {
    lines.push(`- Snapshot vs live overview: ${input.truthParity.matches ? "match" : "drift"}`);
    lines.push(`- Local headline: ${input.truthParity.headlineLocal ?? "n/a"}`);
    lines.push(`- Live headline: ${input.truthParity.headlineLive ?? "n/a"}`);
    lines.push(
      `- Top-line freshness: local ${input.truthParity.topLineFreshnessLocal ?? "n/a"} | live ${input.truthParity.topLineFreshnessLive ?? "n/a"}`
    );
    if (input.truthParity.kpis.length) {
      lines.push("");
      lines.push("## KPI Parity");
      for (const item of input.truthParity.kpis) {
        lines.push(
          `- ${item.key}: ${item.matches ? "match" : "drift"} | local ${item.localValue ?? "n/a"} (${item.localFreshness ?? "n/a"}) | live ${item.liveValue ?? "n/a"} (${item.liveFreshness ?? "n/a"})`
        );
      }
    }
  }

  if (drifted.length) {
    lines.push("");
    lines.push("## Drifted Captures");
    for (const item of drifted) {
      lines.push(
        `- ${item.fileName}: local ${item.localBytes} bytes / ${item.localSha1.slice(0, 12)} | live ${item.liveBytes} bytes / ${item.liveSha1.slice(0, 12)}`
      );
    }
  }

  if (input.localOnly.length) {
    lines.push("");
    lines.push("## Local-Only Captures");
    for (const fileName of input.localOnly) {
      lines.push(`- ${fileName}`);
    }
  }

  if (input.liveOnly.length) {
    lines.push("");
    lines.push("## Live-Only Captures");
    for (const fileName of input.liveOnly) {
      lines.push(`- ${fileName}`);
    }
  }

  fs.writeFileSync(compareJsonPath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  fs.writeFileSync(compareReportPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  if (!fs.existsSync(localLatestDir)) {
    throw new Error(`Local preview atlas is missing: ${localLatestDir}`);
  }

  if (!fs.existsSync(liveLatestDir)) {
    throw new Error(`Live preview atlas is missing: ${liveLatestDir}`);
  }

  const { comparable, localOnly, liveOnly } = compareCaptureFiles();
  const truthParity = await compareTruthParity();
  writeCompareArtifacts({
    comparisons: comparable,
    localOnly,
    liveOnly,
    truthParity
  });

  console.log(`Wrote preview drift report to ${compareReportPath}`);
}

void main();
