import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { chromium, devices, type Browser, type BrowserContext, type Page } from "playwright";

const rootDir = process.cwd();
const previewRoot = path.resolve(rootDir, "reports/previews");
const latestDir = path.join(previewRoot, "latest");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const archiveDir = path.join(previewRoot, "archive", timestamp);
const port = Number(process.env.WARWATCH_PREVIEW_PORT ?? 4327);
const baseUrl = `http://127.0.0.1:${port}`;
const serverEntry = path.resolve(rootDir, "dist/server/server/index.js");
const clientEntry = path.resolve(rootDir, "dist/client/index.html");
const surfacePathMap = {
  preview: "/",
  command: "/command",
  timeline: "/timeline",
  dossiers: "/dossiers",
  signals: "/signals",
  briefings: "/briefings",
  operator: "/operator"
} as const;

type CaptureTarget = {
  title: string;
  fileName: string;
  notes: string;
  group: "snapshot" | "reader" | "operator" | "mobile";
  surface?: "preview" | "command" | "timeline" | "dossiers" | "signals" | "briefings" | "operator";
  selector?: string;
  mobile?: boolean;
};

type PreviewHighlights = {
  heartbeat: string[];
  build: string[];
};

function ensureBuildOutputs() {
  if (!fs.existsSync(serverEntry) || !fs.existsSync(clientEntry)) {
    throw new Error("Build output is missing. Run `npm run build` before capturing previews.");
  }
}

function ensurePreviewDirs() {
  fs.rmSync(latestDir, { recursive: true, force: true });
  fs.mkdirSync(latestDir, { recursive: true });
  fs.mkdirSync(archiveDir, { recursive: true });
}

function readLines(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function firstMatchingLine(lines: string[], prefix: string): string | null {
  return lines.find((line) => line.startsWith(prefix)) ?? null;
}

function loadPreviewHighlights(): PreviewHighlights {
  const heartbeatLines = readLines(path.join(rootDir, "reports/heartbeat/LATEST.md"));
  const buildLines = readLines(path.join(rootDir, "reports/build/LATEST.md"));

  return {
    heartbeat: [
      firstMatchingLine(heartbeatLines, "Public stale flag:"),
      firstMatchingLine(heartbeatLines, "Top-line freshness:"),
      firstMatchingLine(heartbeatLines, "Last successful ingestion:"),
      heartbeatLines.find((line) => line.startsWith("- Pending ")) ?? null
    ].filter((line): line is string => Boolean(line)),
    build: [
      buildLines.find((line) => line.startsWith("- JavaScript:")) ?? null,
      buildLines.find((line) => line.startsWith("- CSS:")) ?? null,
      buildLines.find((line) => line.startsWith("- assets/maplibre-vendor")) ?? null
    ].filter((line): line is string => Boolean(line))
  };
}

function startServer(): ChildProcessWithoutNullStreams {
  return spawn(process.execPath, [serverEntry], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port),
      PUBLIC_BASE_URL: "",
      OPERATOR_API_KEY: "",
      WARWATCH_REQUIRE_OPERATOR_KEY: "false",
      WARWATCH_ENABLE_SCHEDULER: "false"
    },
    stdio: "pipe"
  });
}

async function waitForServer(server: ChildProcessWithoutNullStreams) {
  const deadline = Date.now() + 30_000;
  let lastError = "";

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Preview server exited early: ${lastError || `code ${server.exitCode}`}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
      lastError = `health check status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await delay(500);
  }

  throw new Error(`Preview server did not become ready: ${lastError}`);
}

async function openSurface(page: Page, surface: CaptureTarget["surface"]) {
  const targetSurface = surface ?? "preview";
  await page.goto(`${baseUrl}${surfacePathMap[targetSurface]}`, { waitUntil: "domcontentloaded" });
  await page.locator("header").waitFor();
  await page.locator(`[data-preview="${targetSurface}-surface"]`).waitFor();
}

async function captureSurface(
  browser: Browser,
  target: CaptureTarget
) {
  const context: BrowserContext = target.mobile
    ? await browser.newContext({
        ...devices["iPhone 13"]
      })
    : await browser.newContext({
        viewport: { width: 1536, height: 960 },
        deviceScaleFactor: 1
      });

  const page = await context.newPage();
  await openSurface(page, target.surface);

  const archivePath = path.join(archiveDir, target.fileName);
  const latestPath = path.join(latestDir, target.fileName);

  if (target.selector) {
    await page.locator(target.selector).screenshot({ path: archivePath });
  } else {
    await page.screenshot({ path: archivePath, fullPage: false });
  }

  fs.copyFileSync(archivePath, latestPath);
  await context.close();
}

function groupLabel(group: CaptureTarget["group"]): string {
  if (group === "snapshot") {
    return "Public Site";
  }
  if (group === "reader") {
    return "Reader Lanes";
  }
  if (group === "operator") {
    return "Operator Lanes";
  }
  return "Mobile";
}

function writeAtlasHtml(captures: CaptureTarget[], highlights: PreviewHighlights) {
  const groups: Array<CaptureTarget["group"]> = ["snapshot", "reader", "operator", "mobile"];
  const atlasHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>WarWatch Preview Atlas</title>
    <style>
      :root {
        color-scheme: dark;
        --bg-a: #07111b;
        --bg-b: #16212f;
        --shell: rgba(12, 21, 33, 0.86);
        --line: rgba(120, 160, 190, 0.22);
        --text: #e8eef4;
        --muted: #9caebe;
        --signal: #59d3ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Inter, system-ui, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(89, 211, 255, 0.12), transparent 28%),
          linear-gradient(160deg, var(--bg-a), var(--bg-b));
        color: var(--text);
      }
      main { padding: 32px; }
      .shell { max-width: 1680px; margin: 0 auto; }
      .hero {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 20px;
        align-items: start;
        margin-bottom: 24px;
      }
      .nav {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 0 0 24px;
      }
      .nav a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.03);
        color: var(--text);
        text-decoration: none;
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .panel {
        border: 1px solid var(--line);
        border-radius: 28px;
        background: var(--shell);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
      }
      .meta, .metrics, .summary-panel { padding: 28px; }
      .eyebrow {
        font-size: 12px;
        letter-spacing: 0.34em;
        text-transform: uppercase;
        color: var(--signal);
      }
      h1 {
        margin: 18px 0 0;
        font-size: 52px;
        line-height: 0.94;
        font-weight: 600;
        letter-spacing: -0.03em;
      }
      .copy {
        margin: 18px 0 0;
        max-width: 42rem;
        color: var(--muted);
        font-size: 19px;
        line-height: 1.6;
      }
      .metrics { display: grid; gap: 12px; }
      .metric {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px 16px;
      }
      .metric-label {
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .metric-value { font-size: 14px; font-weight: 600; }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
        margin: 0 0 24px;
      }
      .summary-panel h2 {
        margin: 0;
        font-size: 18px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--signal);
      }
      .summary-panel ul {
        margin: 18px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }
      .summary-panel li {
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 16px;
        color: var(--muted);
        line-height: 1.5;
      }
      .section { margin: 0 0 28px; }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 16px;
        margin: 0 0 14px;
      }
      .section-title { font-size: 28px; line-height: 1; font-weight: 600; }
      .section-copy { max-width: 34rem; color: var(--muted); font-size: 15px; line-height: 1.6; }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
      }
      .card { overflow: hidden; }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 16px;
        padding: 18px 20px 0;
      }
      .card-title { font-size: 22px; font-weight: 600; }
      .card-tag {
        color: var(--signal);
        font-size: 11px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }
      .card-copy {
        padding: 8px 20px 18px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }
      .frame { padding: 0 14px 14px; }
      img {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: #04101a;
      }
      @media (max-width: 1280px) {
        .hero, .summary-grid, .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="shell">
        <section class="hero">
          <div class="panel meta">
            <div class="eyebrow">WarWatch V4 Preview Atlas</div>
            <h1>Full local preview of the public website, reader lanes, operator lanes, and mobile path.</h1>
            <p class="copy">
              This atlas is generated from the built app so COO updates can show concrete product state, not just commit messages, PNG filenames, or markdown artifacts.
            </p>
          </div>
          <div class="panel metrics">
            <div class="metric"><div class="metric-label">Generated</div><div class="metric-value">${new Date().toISOString()}</div></div>
            <div class="metric"><div class="metric-label">Base URL</div><div class="metric-value">${baseUrl}</div></div>
            <div class="metric"><div class="metric-label">Capture count</div><div class="metric-value">${captures.length}</div></div>
            <div class="metric"><div class="metric-label">Artifacts</div><div class="metric-value">index.html + preview-atlas.pdf + preview-board.png</div></div>
          </div>
        </section>

        <nav class="nav">
          <a href="#snapshot">Public Shell</a>
          <a href="#reader">Reader Lanes</a>
          <a href="#operator">Operator Lanes</a>
          <a href="#mobile">Mobile</a>
        </nav>

        <section class="summary-grid">
          <article class="panel summary-panel">
            <h2>Runtime Truth</h2>
            <ul>
              ${
                highlights.heartbeat.length
                  ? highlights.heartbeat.map((line) => `<li>${line}</li>`).join("")
                  : "<li>No heartbeat artifact found.</li>"
              }
            </ul>
          </article>
          <article class="panel summary-panel">
            <h2>Build Pressure</h2>
            <ul>
              ${
                highlights.build.length
                  ? highlights.build.map((line) => `<li>${line}</li>`).join("")
                  : "<li>No build artifact found.</li>"
              }
            </ul>
          </article>
        </section>

        ${groups.map((group) => {
          const groupCaptures = captures.filter((capture) => capture.group === group);
          const description =
            group === "snapshot"
              ? "Best starting point for the public product: homepage, command context, and first-view dossier entry."
              : group === "reader"
                ? "Deep reading lanes for timeline, signals, briefings, dossiers, and source posture."
                : group === "operator"
                  ? "Review, synthesis, and queue-control surfaces used to keep public truth honest."
                  : "Narrow-screen proof that the shell still works as an actual phone surface.";

          return `<section class="section" id="${group}">
            <div class="section-header">
              <div class="section-title">${groupLabel(group)}</div>
              <div class="section-copy">${description}</div>
            </div>
            <div class="grid">
              ${groupCaptures.map((capture) => `<article class="panel card">
                <div class="card-header">
                  <div class="card-title">${capture.title}</div>
                  <div class="card-tag">${capture.mobile ? "Mobile" : "Desktop"}</div>
                </div>
                <div class="card-copy">${capture.notes}</div>
                <div class="frame">
                  <img src="./${capture.fileName}" alt="${capture.title}" />
                </div>
              </article>`).join("\n")}
            </div>
          </section>`;
        }).join("\n")}
      </div>
    </main>
  </body>
</html>`;

  fs.writeFileSync(path.join(archiveDir, "preview-atlas.html"), atlasHtml, "utf8");
  fs.writeFileSync(path.join(latestDir, "preview-atlas.html"), atlasHtml, "utf8");
  fs.writeFileSync(path.join(archiveDir, "index.html"), atlasHtml, "utf8");
  fs.writeFileSync(path.join(latestDir, "index.html"), atlasHtml, "utf8");
}

async function captureBoard(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 1660, height: 2200 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(archiveDir, "preview-atlas.html")).href, {
    waitUntil: "load"
  });
  await page.screenshot({
    path: path.join(archiveDir, "preview-board.png"),
    fullPage: true
  });
  fs.copyFileSync(path.join(archiveDir, "preview-board.png"), path.join(latestDir, "preview-board.png"));
  await page.pdf({
    path: path.join(archiveDir, "preview-atlas.pdf"),
    printBackground: true,
    width: "16in",
    margin: {
      top: "0.35in",
      right: "0.35in",
      bottom: "0.35in",
      left: "0.35in"
    }
  });
  fs.copyFileSync(path.join(archiveDir, "preview-atlas.pdf"), path.join(latestDir, "preview-atlas.pdf"));
  await context.close();
}

function writeLatestReport(captures: CaptureTarget[]) {
  const lines = [
    "# WarWatch Preview Artifact",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}`,
    `Archive: ${archiveDir}`,
    "",
    "## Best Starting Points",
    "- latest/index.html",
    "- latest/preview-atlas.html",
    "- latest/preview-atlas.pdf",
    "- latest/preview-board.png",
    "",
    "## Captures",
    ...captures.map(
      (capture) =>
        `- ${capture.title} :: ${capture.fileName}: ${capture.notes}${capture.mobile ? " (mobile)" : " (desktop)"}`
    ),
    "",
    "## Latest Files",
    "- latest/index.html",
    "- latest/preview-atlas.html",
    "- latest/preview-atlas.pdf",
    "- latest/preview-board.png",
    ...captures.map((capture) => `- latest/${capture.fileName}`)
  ];

  fs.writeFileSync(path.join(previewRoot, "LATEST.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  ensureBuildOutputs();
  ensurePreviewDirs();

  const captures: CaptureTarget[] = [
    {
      title: "Home Surface",
      fileName: "preview-desktop.png",
      notes: "Website-grade public homepage with posture, SITREP, public paths, live markets, and trust framing",
      group: "snapshot",
      surface: "preview"
    },
    {
      title: "Home Dossiers",
      fileName: "preview-dossiers.png",
      notes: "Homepage-level actor and claim posture cards that now open directly into the canonical dossier graph",
      group: "snapshot",
      surface: "preview",
      selector: '[data-preview="preview-dossiers"]'
    },
    {
      title: "Command Surface",
      fileName: "command-desktop.png",
      notes: "Command surface with KPI shell, map lane, and public freshness posture",
      group: "snapshot",
      surface: "command"
    },
    {
      title: "Timeline Surface",
      fileName: "timeline-desktop.png",
      notes: "Filtered chronology explorer with event detail, corroboration, and public posture",
      group: "reader",
      surface: "timeline"
    },
    {
      title: "Dossiers Surface",
      fileName: "dossiers-desktop.png",
      notes: "Canonical actor graph with relationships, linked claims, and evidence handoff into public records",
      group: "reader",
      surface: "dossiers"
    },
    {
      title: "Dossier Detail",
      fileName: "dossiers-detail.png",
      notes: "Focused actor dossier with influence lanes, claim stack, and linked public evidence",
      group: "reader",
      surface: "dossiers",
      selector: '[data-preview="dossiers-detail"]'
    },
    {
      title: "Signals Surface",
      fileName: "signals-desktop.png",
      notes: "Signals surface with live market cards and source table",
      group: "reader",
      surface: "signals"
    },
    {
      title: "Source Reader",
      fileName: "source-reader.png",
      notes: "Source posture with actor-thread handoff into the dossier graph",
      group: "reader",
      surface: "signals",
      selector: '[data-preview="source-reader"]'
    },
    {
      title: "Briefings Surface",
      fileName: "briefings-desktop.png",
      notes: "Briefing archive reader with archive selection, highlights, and full SITREP detail",
      group: "reader",
      surface: "briefings"
    },
    {
      title: "Operator Surface",
      fileName: "operator-desktop.png",
      notes: "Operator surface with top-line controls, synthesis lane, review queue, and ingestion health",
      group: "operator",
      surface: "operator"
    },
    {
      title: "Synthesis Lane",
      fileName: "operator-synthesis.png",
      notes: "Graph-aware story and claim promotion candidates built from recent event evidence",
      group: "operator",
      surface: "operator",
      selector: '[data-preview="operator-synthesis"]'
    },
    {
      title: "Review Dossier",
      fileName: "operator-review-detail.png",
      notes: "Focused review packet for a selected queue item with canonical object detail and related evidence",
      group: "operator",
      surface: "operator",
      selector: '[data-preview="operator-review-detail"]'
    },
    {
      title: "Queue SLA Summary",
      fileName: "operator-queue-summary.png",
      notes: "Focused queue-SLA summary cards for the review backlog",
      group: "operator",
      surface: "operator",
      selector: '[data-preview="operator-queue-summary"]'
    },
    {
      title: "Home Surface Mobile",
      fileName: "preview-mobile.png",
      notes: "Website-grade public homepage on a narrow mobile viewport",
      group: "mobile",
      surface: "preview",
      mobile: true
    }
  ];

  const server = startServer();
  let serverLog = "";
  server.stdout.on("data", (chunk) => {
    serverLog += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverLog += chunk.toString();
  });

  let browser: Browser | null = null;
  try {
    await waitForServer(server);
    browser = await chromium.launch({ headless: true });
    for (const capture of captures) {
      await captureSurface(browser, capture);
    }
    writeAtlasHtml(captures, loadPreviewHighlights());
    await captureBoard(browser);
    writeLatestReport(captures);
    console.log(`Wrote preview artifact to ${path.join(previewRoot, "LATEST.md")}`);
  } catch (error) {
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}${serverLog ? `\n\nServer log:\n${serverLog}` : ""}`
    );
  } finally {
    if (browser) {
      await browser.close();
    }

    if (server.exitCode === null) {
      server.kill("SIGTERM");
      await delay(500);
    }
  }
}

void main();
