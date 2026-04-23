import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const port = 4399;
const smokeDb = path.resolve(root, "data/warwatch-smoke.sqlite");

if (fs.existsSync(smokeDb)) {
  fs.unlinkSync(smokeDb);
}

const child = spawn("node", ["dist/server/server/index.js"], {
  cwd: root,
  stdio: "pipe",
  env: {
    ...process.env,
    PORT: String(port),
    WARWATCH_ENABLE_SCHEDULER: "false",
    WARWATCH_DB_PATH: "data/warwatch-smoke.sqlite"
  }
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let ready = false;
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {
    await wait(500);
  }
}

if (!ready) {
  child.kill("SIGTERM");
  throw new Error("Smoke server did not become ready");
}

for (const route of [
  "/",
  "/timeline",
  "/signals",
  "/briefings",
  "/dossiers",
  "/sitemap.xml",
  "/site.webmanifest",
  "/robots.txt",
  "/api/overview",
  "/api/events?limit=5",
  "/api/map/layers",
  "/api/briefings"
]) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`);
  if (!response.ok) {
    child.kill("SIGTERM");
    throw new Error(`Smoke route failed: ${route} -> ${response.status}`);
  }

  if (["/", "/timeline", "/signals", "/briefings", "/dossiers"].includes(route)) {
    const html = await response.text();
    if (!html.includes('<div id="root"></div>') || !html.includes("WarWatch")) {
      child.kill("SIGTERM");
      throw new Error("Smoke HTML did not include app shell marker");
    }
  }

  if (route === "/site.webmanifest") {
    const manifest = await response.text();
    if (!manifest.includes('"name": "WarWatch"')) {
      child.kill("SIGTERM");
      throw new Error("Smoke manifest did not include WarWatch app name");
    }
  }

  if (route === "/robots.txt") {
    const robots = await response.text();
    if (!robots.includes("Sitemap: /sitemap.xml")) {
      child.kill("SIGTERM");
      throw new Error("Smoke robots.txt did not include sitemap directive");
    }
  }

  if (route === "/sitemap.xml") {
    const sitemap = await response.text();
    if (!sitemap.includes("/timeline") || !sitemap.includes("/briefings")) {
      child.kill("SIGTERM");
      throw new Error("Smoke sitemap did not include public route entries");
    }
  }
}

child.kill("SIGTERM");
console.log("smoke-ok");
