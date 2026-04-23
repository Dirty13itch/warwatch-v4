import express from "express";
import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import type { AppConfig } from "./config.js";
import { getBasePublicPageMeta, normalizePublicPath, publicSitemapRoutes } from "../shared/public-site.js";
import { upsertPreparedMetricSnapshot, runIngestionCycle } from "./ingest.js";
import {
  getEntityDossier,
  getOverview,
  getEvents,
  getEventById,
  getGraphSnapshot,
  getMetricHistory,
  getBriefings,
  getMapLayers,
  getStories,
  getSources,
  getReviewQueue,
  getReviewQueueDetail,
  getReviewQueueSummary,
  getIngestionRuns,
  getTopLineMetrics,
  setQueueStatus
} from "./store.js";
import { generateDailyBriefing } from "./briefings.js";
import { buildTopLineHoldInput, getTopLineMetricDefinition, isTopLineMetricKey } from "../shared/topline.js";
import { confidenceLevels, type OperatorMetricPublishInput } from "../shared/types.js";
import { getTopLineSuggestions } from "./topline.js";
import { getSynthesisSuggestions, queueClaimSuggestion, queueStorySuggestion } from "./synthesis.js";

type PublicPageMeta = {
  title: string;
  description: string;
  robots: string;
  canonicalUrl: string;
  imageUrl: string;
};

function operatorKeyRequired(config: AppConfig): boolean {
  return (
    Boolean(config.operatorApiKey) ||
    Boolean(config.publicBaseUrl) ||
    process.env.NODE_ENV === "production" ||
    process.env.WARWATCH_REQUIRE_OPERATOR_KEY === "true"
  );
}

function operatorAllowed(config: AppConfig, req: express.Request): boolean {
  if (!operatorKeyRequired(config)) {
    return true;
  }

  if (!config.operatorApiKey) {
    return false;
  }

  return req.header("x-warwatch-operator-key") === config.operatorApiKey;
}

function resolvePublicSiteBaseUrl(config: AppConfig, req: express.Request): string {
  if (config.publicBaseUrl) {
    return config.publicBaseUrl.replace(/\/+$/, "");
  }

  const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  const host = forwardedHost || req.get("host") || "localhost";
  return `${protocol}://${host}`;
}

function truncateSummary(value: string, maxLength = 180): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
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

function buildPublicPageMeta(db: DatabaseSync, config: AppConfig, req: express.Request): PublicPageMeta {
  const pathname = normalizePublicPath(req.path);
  const baseUrl = resolvePublicSiteBaseUrl(config, req);
  const canonicalUrl = new URL(req.originalUrl || pathname, `${baseUrl}/`).toString();
  const baseMeta = getBasePublicPageMeta(pathname);
  let title = baseMeta.title;
  let description = baseMeta.description;
  let robots = baseMeta.robots;

  if (pathname === "/timeline") {
    if (typeof req.query.event === "string" && req.query.event.trim()) {
      const event = getEventById(db, req.query.event);
      if (event) {
        title = `${event.title} | WarWatch Timeline`;
        description = truncateSummary(event.detail);
      }
    }
  } else if (pathname === "/dossiers") {
    if (typeof req.query.entity === "string" && req.query.entity.trim()) {
      const dossier = getEntityDossier(db, req.query.entity);
      if (dossier) {
        title = `${dossier.entity.name} dossier | WarWatch`;
        description = truncateSummary(
          dossier.claims[0]?.statement ??
            dossier.stories[0]?.summary ??
            `${dossier.entity.name} dossier with linked claims, stories, events, and briefings.`
        );
      }
    }
  } else if (pathname === "/signals") {
    if (typeof req.query.source === "string" && req.query.source.trim()) {
      const source = getSources(db).find((item) => item.slug === req.query.source);
      if (source) {
        title = `${source.name} source posture | WarWatch`;
        description = truncateSummary(
          source.notes ||
            `${source.name} source posture with reliability, bias, and canonical story links in the WarWatch signals lane.`
        );
      }
    }
  }

  return {
    title,
    description: truncateSummary(description),
    robots,
    canonicalUrl,
    imageUrl: `${baseUrl}/og-card.svg`
  };
}

function renderClientShell(indexHtml: string, meta: PublicPageMeta): string {
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
      `<meta property="og:image" content="${escapeHtmlAttribute(meta.imageUrl)}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${escapeHtmlAttribute(meta.canonicalUrl)}" />`
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
      `<meta name="twitter:image" content="${escapeHtmlAttribute(meta.imageUrl)}" />`
    )
    .replace(
      /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:url" content="${escapeHtmlAttribute(meta.canonicalUrl)}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapeHtmlAttribute(meta.canonicalUrl)}" />`
    );
}

export function createApp(db: DatabaseSync, config: AppConfig) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, generatedAt: new Date().toISOString() });
  });

  app.get("/api/overview", (_req, res) => {
    res.json(getOverview(db));
  });

  app.get("/api/events", (req, res) => {
    res.json(
      getEvents(db, {
        includeHidden: req.query.review === "all",
        category: typeof req.query.category === "string" ? req.query.category : null,
        limit: typeof req.query.limit === "string" ? Number(req.query.limit) : 200
      })
    );
  });

  app.get("/api/events/:id", (req, res) => {
    const event = getEventById(db, req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.json(event);
  });

  app.get("/api/metrics/:key/history", (req, res) => {
    res.json(getMetricHistory(db, req.params.key));
  });

  app.get("/api/briefings", (_req, res) => {
    res.json(getBriefings(db));
  });

  app.get("/api/map/layers", (_req, res) => {
    res.json(getMapLayers(db));
  });

  app.get("/api/stories", (req, res) => {
    const section = typeof req.query.section === "string" ? req.query.section : undefined;
    res.json(getStories(db, section));
  });

  app.get("/api/sources", (_req, res) => {
    res.json(getSources(db));
  });

  app.get("/api/graph", (_req, res) => {
    res.json(getGraphSnapshot(db));
  });

  app.get("/api/entities/:key/dossier", (req, res) => {
    const dossier = getEntityDossier(db, req.params.key);
    if (!dossier) {
      return res.status(404).json({ error: "Entity dossier not found" });
    }

    return res.json(dossier);
  });

  app.use("/api/operator", (req, res, next) => {
    if (!operatorAllowed(config, req)) {
      return res.status(401).json({ error: "Operator API key required" });
    }

    return next();
  });

  app.get("/api/operator/review-queue", (_req, res) => {
    res.json(getReviewQueue(db));
  });

  app.get("/api/operator/review-queue/summary", (_req, res) => {
    res.json(getReviewQueueSummary(db));
  });

  app.get("/api/operator/review-queue/:id", (req, res) => {
    const detail = getReviewQueueDetail(db, req.params.id);
    if (!detail) {
      return res.status(404).json({ error: "Queue item not found" });
    }

    return res.json(detail);
  });

  app.post("/api/operator/review-queue/:id/approve", (req, res) => {
    const updated = setQueueStatus(db, req.params.id, "approved");
    if (!updated) {
      return res.status(404).json({ error: "Queue item not found" });
    }

    return res.json(updated);
  });

  app.post("/api/operator/review-queue/:id/reject", (req, res) => {
    const updated = setQueueStatus(db, req.params.id, "rejected");
    if (!updated) {
      return res.status(404).json({ error: "Queue item not found" });
    }

    return res.json(updated);
  });

  app.get("/api/operator/ingestion-runs", (_req, res) => {
    res.json(getIngestionRuns(db));
  });

  app.get("/api/operator/topline-metrics", (_req, res) => {
    res.json(getTopLineMetrics(db));
  });

  app.get("/api/operator/topline-suggestions", (_req, res) => {
    res.json(getTopLineSuggestions(db));
  });

  app.get("/api/operator/synthesis", (_req, res) => {
    res.json(getSynthesisSuggestions(db));
  });

  app.post("/api/operator/synthesis/stories/:id/queue", (req, res) => {
    const queueId = queueStorySuggestion(db, req.params.id);
    if (!queueId) {
      return res.status(404).json({ error: "Story suggestion not found" });
    }

    const queueItem = getReviewQueue(db).find((item) => item.id === queueId);
    if (!queueItem) {
      return res.status(500).json({ error: "Queued review item missing" });
    }

    return res.json(queueItem);
  });

  app.post("/api/operator/synthesis/claims/:id/queue", (req, res) => {
    const queueId = queueClaimSuggestion(db, req.params.id);
    if (!queueId) {
      return res.status(404).json({ error: "Claim suggestion not found" });
    }

    const queueItem = getReviewQueue(db).find((item) => item.id === queueId);
    if (!queueItem) {
      return res.status(500).json({ error: "Queued review item missing" });
    }

    return res.json(queueItem);
  });

  app.post("/api/operator/topline-metrics/:key", (req, res) => {
    if (!isTopLineMetricKey(req.params.key)) {
      return res.status(404).json({ error: "Top-line metric not found" });
    }

    const body = req.body as Partial<OperatorMetricPublishInput>;
    const mode = body.mode === "hold" ? "hold" : "publish";
    const normalizedBody =
      mode === "hold"
        ? {
            ...buildTopLineHoldInput(req.params.key),
            ...body,
            mode
          }
        : body;

    if (typeof normalizedBody.valueText !== "string" || !normalizedBody.valueText.trim()) {
      return res.status(400).json({ error: "valueText is required" });
    }
    if (typeof normalizedBody.sourceText !== "string" || !normalizedBody.sourceText.trim()) {
      return res.status(400).json({ error: "sourceText is required" });
    }
    if (typeof normalizedBody.confidence !== "string" || !confidenceLevels.includes(normalizedBody.confidence)) {
      return res.status(400).json({ error: "confidence is invalid" });
    }
    if (
      normalizedBody.value !== null &&
      normalizedBody.value !== undefined &&
      (typeof normalizedBody.value !== "number" || !Number.isFinite(normalizedBody.value))
    ) {
      return res.status(400).json({ error: "value must be numeric or null" });
    }

    const now = new Date().toISOString();
    const definition = getTopLineMetricDefinition(req.params.key);
    upsertPreparedMetricSnapshot(db, {
      metricKey: req.params.key,
      value: normalizedBody.value ?? null,
      valueText: normalizedBody.valueText.trim(),
      unit: definition.unit,
      timestamp: now,
      sourceText: normalizedBody.sourceText.trim(),
      confidence: normalizedBody.confidence,
      reviewState: "approved",
      freshness: mode === "hold" ? "operator_hold" : "operator_reviewed",
      meta: {
        note: typeof normalizedBody.note === "string" ? normalizedBody.note.trim() : "",
        operatorUpdatedAt: now,
        mode
      }
    });
    generateDailyBriefing(db);

    const updated = getTopLineMetrics(db).find((metric) => metric.key === req.params.key);
    return res.json(updated);
  });

  app.post("/api/operator/ingest", async (_req, res) => {
    await runIngestionCycle(db);
    generateDailyBriefing(db);
    res.json({ ok: true });
  });

  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = resolvePublicSiteBaseUrl(config, req);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicSitemapRoutes
      .map((route) => `  <url><loc>${baseUrl}${route}</loc></url>`)
      .join("\n")}\n</urlset>`;
    res.type("application/xml").send(xml);
  });

  const clientDist = path.resolve(config.rootDir, "dist/client");
  if (fs.existsSync(clientDist)) {
    const clientIndexPath = path.join(clientDist, "index.html");
    const clientIndexHtml = fs.readFileSync(clientIndexPath, "utf8");

    app.use(
      express.static(clientDist, {
        index: false,
        setHeaders(res, filePath) {
          const fileName = path.basename(filePath);
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            return;
          }

          if (fileName === "site.webmanifest" || fileName === "robots.txt" || fileName.endsWith(".svg")) {
            res.setHeader("Cache-Control", "public, max-age=3600");
          }
        }
      })
    );

    app.get(/^\/(?!api(?:\/|$)|sitemap\.xml$).*/, (req, res, next) => {
      if (req.path === "/api" || req.path.startsWith("/api/")) {
        return next();
      }

      const meta = buildPublicPageMeta(db, config, req);
      res.type("html").set("Cache-Control", "no-cache");
      if (meta.robots.startsWith("noindex")) {
        res.set("X-Robots-Tag", meta.robots);
      }

      return res.send(renderClientShell(clientIndexHtml, meta));
    });
  }

  return app;
}
