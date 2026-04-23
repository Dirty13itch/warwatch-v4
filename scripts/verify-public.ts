import { loadConfig } from "../server/config.js";

const config = loadConfig();
if (!config.publicBaseUrl) {
  console.log("verify-public skipped: PUBLIC_BASE_URL not set");
  process.exit(0);
}

const baseUrl = config.publicBaseUrl.replace(/\/$/, "");
type PageCheck = {
  route: string;
  title: string;
  robots: string;
  headerRobots?: string;
};

const pageChecks: PageCheck[] = [
  {
    route: "/",
    title: "WarWatch | Public briefing website for the Iran conflict",
    robots: "index,follow"
  },
  {
    route: "/timeline",
    title: "Timeline | WarWatch",
    robots: "index,follow"
  },
  {
    route: "/signals",
    title: "Signals | WarWatch",
    robots: "index,follow"
  },
  {
    route: "/briefings",
    title: "Briefings | WarWatch",
    robots: "index,follow"
  },
  {
    route: "/dossiers",
    title: "Dossiers | WarWatch",
    robots: "index,follow"
  },
  {
    route: "/operator",
    title: "Operator | WarWatch",
    robots: "noindex,nofollow",
    headerRobots: "noindex,nofollow"
  }
];

for (const route of ["/api/health", "/api/overview"]) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) {
    throw new Error(`Public verification failed for ${route}: ${response.status}`);
  }
}

for (const page of pageChecks) {
  const response = await fetch(`${baseUrl}${page.route}`);
  if (!response.ok) {
    throw new Error(`Public verification failed for ${page.route}: ${response.status}`);
  }

  const html = await response.text();
  const canonical = new URL(page.route, `${baseUrl}/`).toString();
  if (!html.includes(`<title>${page.title}</title>`)) {
    throw new Error(`Public verification failed for ${page.route}: missing route title`);
  }
  if (!html.includes(`rel="canonical" href="${canonical}"`)) {
    throw new Error(`Public verification failed for ${page.route}: canonical mismatch`);
  }
  if (!html.includes(`name="robots" content="${page.robots}"`)) {
    throw new Error(`Public verification failed for ${page.route}: robots mismatch`);
  }
  if (!html.includes(`property="og:url" content="${canonical}"`)) {
    throw new Error(`Public verification failed for ${page.route}: og:url mismatch`);
  }
  if (page.headerRobots && response.headers.get("x-robots-tag") !== page.headerRobots) {
    throw new Error(`Public verification failed for ${page.route}: x-robots-tag mismatch`);
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
  if (
    !sitemap.includes(`${baseUrl}/timeline`) ||
    !sitemap.includes(`${baseUrl}/briefings`) ||
    sitemap.includes(`${baseUrl}/operator`)
  ) {
    throw new Error("Public verification failed for /sitemap.xml: missing public routes");
  }
}

console.log(`verify-public ok for ${baseUrl}`);
