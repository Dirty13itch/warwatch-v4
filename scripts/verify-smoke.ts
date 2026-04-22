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

for (const route of ["/", "/api/overview", "/api/events?limit=5", "/api/map/layers", "/api/briefings"]) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`);
  if (!response.ok) {
    child.kill("SIGTERM");
    throw new Error(`Smoke route failed: ${route} -> ${response.status}`);
  }

  if (route === "/") {
    const html = await response.text();
    if (!html.includes("WarWatch V4")) {
      child.kill("SIGTERM");
      throw new Error("Smoke HTML did not include app shell marker");
    }
  }
}

child.kill("SIGTERM");
console.log("smoke-ok");
