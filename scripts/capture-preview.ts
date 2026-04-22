import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
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
  fileName: string;
  notes: string;
  surface?: "command" | "signals" | "operator";
  selector?: string;
  mobile?: boolean;
};

function ensureBuildOutputs() {
  if (!fs.existsSync(serverEntry) || !fs.existsSync(clientEntry)) {
    throw new Error("Build output is missing. Run `npm run build` before capturing previews.");
  }
}

function ensurePreviewDirs() {
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

  if (!surface || surface === "command") {
    await page.locator('[data-preview="command-surface"]').waitFor();
    return;
  }

  await page.getByRole("button", { name: new RegExp(surface, "i") }).click();
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

function writeLatestReport(captures: CaptureTarget[]) {
  const lines = [
    "# WarWatch Preview Artifact",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}`,
    `Archive: ${archiveDir}`,
    "",
    "## Captures",
    ...captures.map(
      (capture) =>
        `- ${capture.fileName}: ${capture.notes}${capture.mobile ? " (mobile)" : " (desktop)"}`
    ),
    "",
    "## Latest Files",
    ...captures.map((capture) => `- latest/${capture.fileName}`)
  ];

  fs.writeFileSync(path.join(previewRoot, "LATEST.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  ensureBuildOutputs();
  ensurePreviewDirs();

  const captures: CaptureTarget[] = [
    {
      fileName: "command-desktop.png",
      notes: "Command surface with KPI shell, map lane, and public freshness posture",
      surface: "command"
    },
    {
      fileName: "signals-desktop.png",
      notes: "Signals surface with live market cards and source table",
      surface: "signals"
    },
    {
      fileName: "operator-desktop.png",
      notes: "Operator surface with top-line controls, review queue, and ingestion health",
      surface: "operator"
    },
    {
      fileName: "operator-queue-summary.png",
      notes: "Focused queue-SLA summary cards for the review backlog",
      surface: "operator",
      selector: '[data-preview="operator-queue-summary"]'
    },
    {
      fileName: "command-mobile.png",
      notes: "Command surface on a narrow mobile viewport",
      surface: "command",
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
