import fs from "node:fs";
import path from "node:path";
import { getBasePublicPageMeta, publicSiteSurfaces } from "../shared/public-site.js";
import type { PublicDataSnapshot } from "../shared/types.js";

const root = process.cwd();
const distDir = path.resolve(root, "dist/client");
const snapshotPath = path.resolve(root, "data/public-snapshot.json");

function resolveExpectedBaseUrl(): string {
  const explicit = process.env.PUBLIC_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  return "http://127.0.0.1:4311";
}

if (!fs.existsSync(snapshotPath)) {
  throw new Error("Hosted static verification failed: public snapshot missing");
}

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as PublicDataSnapshot;
if (!snapshot.overview || !snapshot.events.length || !snapshot.dossiers.length) {
  throw new Error("Hosted static verification failed: public snapshot missing core data");
}

const baseUrl = resolveExpectedBaseUrl();

for (const surface of publicSiteSurfaces) {
  const targetPath =
    surface.path === "/"
      ? path.join(distDir, "index.html")
      : path.join(distDir, surface.path.replace(/^\//, ""), "index.html");
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Hosted static verification failed: missing route file for ${surface.path}`);
  }

  const html = fs.readFileSync(targetPath, "utf8");
  const meta = getBasePublicPageMeta(surface.path);
  const canonical = new URL(surface.path, `${baseUrl}/`).toString();
  if (!html.includes(`<title>${meta.title}</title>`)) {
    throw new Error(`Hosted static verification failed: missing title for ${surface.path}`);
  }
  if (!html.includes(`name="robots" content="${meta.robots}"`)) {
    throw new Error(`Hosted static verification failed: robots mismatch for ${surface.path}`);
  }
  if (!html.includes(`rel="canonical" href="${canonical}"`)) {
    throw new Error(`Hosted static verification failed: canonical mismatch for ${surface.path}`);
  }
}

const sitemapPath = path.join(distDir, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  throw new Error("Hosted static verification failed: sitemap.xml missing");
}

const sitemap = fs.readFileSync(sitemapPath, "utf8");
if (!sitemap.includes(`${baseUrl}/timeline`) || !sitemap.includes(`${baseUrl}/command`) || sitemap.includes(`${baseUrl}/operator`)) {
  throw new Error("Hosted static verification failed: sitemap routes are wrong");
}

console.log("hosted-static-ok");
