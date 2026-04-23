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

for (const route of ["/", "/timeline", "/signals", "/briefings", "/dossiers"]) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) {
    throw new Error(`Public verification failed for ${route}: ${response.status}`);
  }

  const html = await response.text();
  if (!html.includes("WarWatch")) {
    throw new Error(`Public verification failed for ${route}: missing WarWatch shell`);
  }
}

{
  const response = await fetch(`${baseUrl}/site.webmanifest`);
  if (!response.ok) {
    throw new Error(`Public verification failed for /site.webmanifest: ${response.status}`);
  }

  const manifest = (await response.json()) as { name?: string };
  if (manifest.name !== "WarWatch") {
    throw new Error("Public verification failed for /site.webmanifest: unexpected manifest name");
  }
}

{
  const response = await fetch(`${baseUrl}/robots.txt`);
  if (!response.ok) {
    throw new Error(`Public verification failed for /robots.txt: ${response.status}`);
  }

  const robots = await response.text();
  if (!robots.includes("Sitemap:")) {
    throw new Error("Public verification failed for /robots.txt: missing sitemap directive");
  }
}

{
  const response = await fetch(`${baseUrl}/sitemap.xml`);
  if (!response.ok) {
    throw new Error(`Public verification failed for /sitemap.xml: ${response.status}`);
  }

  const sitemap = await response.text();
  if (!sitemap.includes(`${baseUrl}/timeline`) || !sitemap.includes(`${baseUrl}/briefings`)) {
    throw new Error("Public verification failed for /sitemap.xml: missing public routes");
  }
}

console.log(`verify-public ok for ${baseUrl}`);
