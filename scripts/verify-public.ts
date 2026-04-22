import { loadConfig } from "../server/config.js";

const config = loadConfig();
if (!config.publicBaseUrl) {
  console.log("verify-public skipped: PUBLIC_BASE_URL not set");
  process.exit(0);
}

const baseUrl = config.publicBaseUrl.replace(/\/$/, "");
for (const route of ["/api/health", "/api/overview"]) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) {
    throw new Error(`Public verification failed for ${route}: ${response.status}`);
  }
}

console.log(`verify-public ok for ${baseUrl}`);

