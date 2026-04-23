import fs from "node:fs";
import path from "node:path";
import { getBasePublicPageMeta, publicSiteSurfaces, publicSitemapRoutes } from "../shared/public-site.js";

const root = process.cwd();
const clientDist = path.resolve(root, "dist/client");
const clientIndexPath = path.join(clientDist, "index.html");

function resolvePublicSiteBaseUrl(): string {
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

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderClientShell(indexHtml: string, routePath: string, baseUrl: string): string {
  const meta = getBasePublicPageMeta(routePath);
  const canonicalUrl = new URL(routePath, `${baseUrl}/`).toString();
  const imageUrl = `${baseUrl}/og-card.svg`;

  return indexHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlText(meta.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtmlAttribute(meta.description)}" />`
    )
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${escapeHtmlAttribute(meta.robots)}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtmlAttribute(meta.title)}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtmlAttribute(meta.description)}" />`
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${escapeHtmlAttribute(imageUrl)}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${escapeHtmlAttribute(canonicalUrl)}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${escapeHtmlAttribute(meta.title)}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${escapeHtmlAttribute(meta.description)}" />`
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${escapeHtmlAttribute(imageUrl)}" />`
    )
    .replace(
      /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:url" content="${escapeHtmlAttribute(canonicalUrl)}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapeHtmlAttribute(canonicalUrl)}" />`
    );
}

if (!fs.existsSync(clientIndexPath)) {
  throw new Error(`Hosted static site generation failed: ${clientIndexPath} is missing`);
}

const baseUrl = resolvePublicSiteBaseUrl();
const clientIndexHtml = fs.readFileSync(clientIndexPath, "utf8");

for (const surface of publicSiteSurfaces) {
  const rendered = renderClientShell(clientIndexHtml, surface.path, baseUrl);
  const targetPath =
    surface.path === "/"
      ? clientIndexPath
      : path.join(clientDist, surface.path.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, rendered);
}

const sitemapPath = path.join(clientDist, "sitemap.xml");
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicSitemapRoutes
  .map((route) => `  <url><loc>${new URL(route, `${baseUrl}/`).toString()}</loc></url>`)
  .join("\n")}\n</urlset>\n`;
fs.writeFileSync(sitemapPath, sitemapXml);

console.log(`static-site ok -> ${clientDist}`);
