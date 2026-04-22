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

type CaptureTarget = {
  title: string;
  fileName: string;
  notes: string;
  surface?: "preview" | "command" | "timeline" | "dossiers" | "signals" | "briefings" | "operator";
  selector?: string;
  mobile?: boolean;
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

function startServer(): ChildProcessWithoutNullStreams {
  return spawn(process.execPath, [serverEntry], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port),
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
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator("header").waitFor();

  if (!surface || surface === "preview") {
    await page.locator('[data-preview="preview-surface"]').waitFor();
    return;
  }

  const label =
    surface === "command"
      ? "Command"
      : surface === "timeline"
        ? "Timeline"
        : surface === "dossiers"
          ? "Dossiers"
        : surface === "signals"
          ? "Signals"
          : surface === "briefings"
            ? "Briefings"
          : "Operator";
  await page.getByRole("button", { name: new RegExp(label, "i") }).click();
  await page.locator(`[data-preview="${surface}-surface"]`).waitFor();
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

function writeBoardHtml(captures: CaptureTarget[]) {
  const boardHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>WarWatch Preview Board</title>
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
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: "Segoe UI", Inter, system-ui, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(89, 211, 255, 0.12), transparent 28%),
          linear-gradient(160deg, var(--bg-a), var(--bg-b));
        color: var(--text);
      }
      main {
        padding: 32px;
      }
      .hero {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 20px;
        align-items: start;
        margin-bottom: 24px;
      }
      .panel {
        border: 1px solid var(--line);
        border-radius: 28px;
        background: var(--shell);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
      }
      .meta {
        padding: 28px;
      }
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
      .metrics {
        display: grid;
        gap: 12px;
        padding: 28px;
      }
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
      .metric-value {
        font-size: 14px;
        font-weight: 600;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
      }
      .card {
        overflow: hidden;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 16px;
        padding: 18px 20px 0;
      }
      .card-title {
        font-size: 22px;
        font-weight: 600;
      }
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
      .frame {
        padding: 0 14px 14px;
      }
      img {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: #04101a;
      }
      @media (max-width: 1280px) {
        .hero,
        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="panel meta">
          <div class="eyebrow">WarWatch V4 Preview Board</div>
          <h1>Current visual proof for the snapshot, dossier, command, signals, operator, and synthesis lanes.</h1>
          <p class="copy">
            This board is generated from the built app so COO updates can show concrete UI state, not just commit messages and markdown artifacts.
          </p>
        </div>
        <div class="panel metrics">
          <div class="metric">
            <div class="metric-label">Generated</div>
            <div class="metric-value">${new Date().toISOString()}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Base URL</div>
            <div class="metric-value">${baseUrl}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Capture count</div>
            <div class="metric-value">${captures.length}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Artifacts</div>
            <div class="metric-value">latest/*.png + preview-board.png</div>
          </div>
        </div>
      </section>

      <section class="grid">
        ${captures
          .map(
            (capture) => `<article class="panel card">
          <div class="card-header">
            <div class="card-title">${capture.title}</div>
            <div class="card-tag">${capture.mobile ? "Mobile" : "Desktop"}</div>
          </div>
          <div class="card-copy">${capture.notes}</div>
          <div class="frame">
            <img src="${pathToFileURL(path.join(archiveDir, capture.fileName)).href}" alt="${capture.title}" />
          </div>
        </article>`
          )
          .join("\n")}
      </section>
    </main>
  </body>
</html>`;

  const archiveHtmlPath = path.join(archiveDir, "preview-board.html");
  const latestHtmlPath = path.join(latestDir, "preview-board.html");
  fs.writeFileSync(archiveHtmlPath, boardHtml, "utf8");
  fs.writeFileSync(latestHtmlPath, boardHtml, "utf8");
}

async function captureBoard(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 1660, height: 2200 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(archiveDir, "preview-board.html")).href, {
    waitUntil: "load"
  });
  await page.screenshot({
    path: path.join(archiveDir, "preview-board.png"),
    fullPage: true
  });
  fs.copyFileSync(path.join(archiveDir, "preview-board.png"), path.join(latestDir, "preview-board.png"));
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
    "## Board",
    `- latest/preview-board.png`,
    "",
    "## Captures",
    ...captures.map(
      (capture) =>
        `- ${capture.title} :: ${capture.fileName}: ${capture.notes}${capture.mobile ? " (mobile)" : " (desktop)"}`
    ),
    "",
    "## Latest Files",
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
      title: "Snapshot Surface",
      fileName: "preview-desktop.png",
      notes: "Curated public snapshot with posture, SITREP, fronts, live markets, and trust framing",
      surface: "preview"
    },
    {
      title: "Snapshot Dossiers",
      fileName: "preview-dossiers.png",
      notes: "Snapshot-level actor and claim posture cards that now open directly into the canonical dossier graph",
      surface: "preview",
      selector: '[data-preview="preview-dossiers"]'
    },
    {
      title: "Command Surface",
      fileName: "command-desktop.png",
      notes: "Command surface with KPI shell, map lane, and public freshness posture",
      surface: "command"
    },
    {
      title: "Timeline Surface",
      fileName: "timeline-desktop.png",
      notes: "Filtered chronology explorer with event detail, corroboration, and public posture",
      surface: "timeline"
    },
    {
      title: "Dossiers Surface",
      fileName: "dossiers-desktop.png",
      notes: "Canonical actor graph with relationships, linked claims, and evidence handoff into public records",
      surface: "dossiers"
    },
    {
      title: "Dossier Detail",
      fileName: "dossiers-detail.png",
      notes: "Focused actor dossier with influence lanes, claim stack, and linked public evidence",
      surface: "dossiers",
      selector: '[data-preview="dossiers-detail"]'
    },
    {
      title: "Signals Surface",
      fileName: "signals-desktop.png",
      notes: "Signals surface with live market cards and source table",
      surface: "signals"
    },
    {
      title: "Source Reader",
      fileName: "source-reader.png",
      notes: "Source posture with actor-thread handoff into the dossier graph",
      surface: "signals",
      selector: '[data-preview="source-reader"]'
    },
    {
      title: "Briefings Surface",
      fileName: "briefings-desktop.png",
      notes: "Briefing archive reader with archive selection, highlights, and full SITREP detail",
      surface: "briefings"
    },
    {
      title: "Operator Surface",
      fileName: "operator-desktop.png",
      notes: "Operator surface with top-line controls, synthesis lane, review queue, and ingestion health",
      surface: "operator"
    },
    {
      title: "Synthesis Lane",
      fileName: "operator-synthesis.png",
      notes: "Graph-aware story and claim promotion candidates built from recent event evidence",
      surface: "operator",
      selector: '[data-preview="operator-synthesis"]'
    },
    {
      title: "Review Dossier",
      fileName: "operator-review-detail.png",
      notes: "Focused review packet for a selected queue item with canonical object detail and related evidence",
      surface: "operator",
      selector: '[data-preview="operator-review-detail"]'
    },
    {
      title: "Queue SLA Summary",
      fileName: "operator-queue-summary.png",
      notes: "Focused queue-SLA summary cards for the review backlog",
      surface: "operator",
      selector: '[data-preview="operator-queue-summary"]'
    },
    {
      title: "Snapshot Surface Mobile",
      fileName: "preview-mobile.png",
      notes: "Curated public snapshot on a narrow mobile viewport",
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
    writeBoardHtml(captures);
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
