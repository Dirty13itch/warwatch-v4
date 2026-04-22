import express from "express";
import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import type { AppConfig } from "./config.js";
import {
  getOverview,
  getEvents,
  getEventById,
  getMetricHistory,
  getBriefings,
  getMapLayers,
  getStories,
  getSources,
  getReviewQueue,
  getIngestionRuns,
  setQueueStatus
} from "./store.js";
import { runIngestionCycle } from "./ingest.js";
import { generateDailyBriefing } from "./briefings.js";

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

  app.use("/api/operator", (req, res, next) => {
    if (!operatorAllowed(config, req)) {
      return res.status(401).json({ error: "Operator API key required" });
    }

    return next();
  });

  app.get("/api/operator/review-queue", (_req, res) => {
    res.json(getReviewQueue(db));
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
