import express from "express";
import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import type { AppConfig } from "./config.js";
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
import { getTopLineMetricDefinition, isTopLineMetricKey } from "../shared/topline.js";
import { confidenceLevels, type OperatorMetricPublishInput } from "../shared/types.js";
import { getTopLineSuggestions } from "./topline.js";
import { getSynthesisSuggestions } from "./synthesis.js";

function operatorAllowed(config: AppConfig, req: express.Request): boolean {
  if (!config.operatorApiKey) {
    return process.env.NODE_ENV !== "production";
  }

  return req.header("x-warwatch-operator-key") === config.operatorApiKey;
}

export function createApp(db: DatabaseSync, config: AppConfig) {
  const app = express();
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

  app.post("/api/operator/topline-metrics/:key", (req, res) => {
    if (!isTopLineMetricKey(req.params.key)) {
      return res.status(404).json({ error: "Top-line metric not found" });
    }

    const body = req.body as Partial<OperatorMetricPublishInput>;
    if (typeof body.valueText !== "string" || !body.valueText.trim()) {
      return res.status(400).json({ error: "valueText is required" });
    }
    if (typeof body.sourceText !== "string" || !body.sourceText.trim()) {
      return res.status(400).json({ error: "sourceText is required" });
    }
    if (typeof body.confidence !== "string" || !confidenceLevels.includes(body.confidence)) {
      return res.status(400).json({ error: "confidence is invalid" });
    }
    if (
      body.value !== null &&
      body.value !== undefined &&
      (typeof body.value !== "number" || !Number.isFinite(body.value))
    ) {
      return res.status(400).json({ error: "value must be numeric or null" });
    }

    const now = new Date().toISOString();
    const definition = getTopLineMetricDefinition(req.params.key);
    upsertPreparedMetricSnapshot(db, {
      metricKey: req.params.key,
      value: body.value ?? null,
      valueText: body.valueText.trim(),
      unit: definition.unit,
      timestamp: now,
      sourceText: body.sourceText.trim(),
      confidence: body.confidence,
      reviewState: "approved",
      freshness: "operator_reviewed",
      meta: {
        note: typeof body.note === "string" ? body.note.trim() : "",
        operatorUpdatedAt: now
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

  const clientDist = path.resolve(config.rootDir, "dist/client");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api\/).*/, (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }

      return res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  return app;
}
