import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { openDatabase } from "./db";

const config = loadConfig(process.cwd());
const db = openDatabase({
  dbPath: ":memory:",
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});
const app = createApp(db, {
  ...config,
  operatorApiKey: "",
  enableScheduler: false
});

beforeAll(() => {
  process.env.NODE_ENV = "test";
});

afterAll(() => {
  db.close();
});

describe("WarWatch API", () => {
  it("serves the overview from the seeded database", async () => {
    const response = await request(app).get("/api/overview");
    expect(response.status).toBe(200);
    expect(response.body.kpis.length).toBeGreaterThan(0);
    expect(response.body.fronts.length).toBeGreaterThan(0);
  });

  it("exposes the canonical graph and actor dossiers", async () => {
    const graph = await request(app).get("/api/graph");
    expect(graph.status).toBe(200);
    expect(graph.body.entities.length).toBeGreaterThan(0);
    expect(graph.body.claims.length).toBeGreaterThan(0);
    expect(graph.body.relationships.length).toBeGreaterThan(0);

    const dossier = await request(app).get("/api/entities/iran/dossier");
    expect(dossier.status).toBe(200);
    expect(dossier.body.entity.slug).toBe("iran");
    expect(Array.isArray(dossier.body.relationships)).toBe(true);
    expect(Array.isArray(dossier.body.events)).toBe(true);
    expect(Array.isArray(dossier.body.stories)).toBe(true);
  });

  it("exposes operator queue and can approve seeded queue items", async () => {
    const queue = await request(app).get("/api/operator/review-queue");
    expect(queue.status).toBe(200);
    expect(queue.body.length).toBeGreaterThan(0);
    expect(typeof queue.body[0].ageHours).toBe("number");
    expect(["fresh", "aging", "stale"]).toContain(queue.body[0].ageBucket);

    const summary = await request(app).get("/api/operator/review-queue/summary");
    expect(summary.status).toBe(200);
    expect(summary.body.pending).toBeGreaterThan(0);

    const detail = await request(app).get(`/api/operator/review-queue/${queue.body[0].id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.item.id).toBe(queue.body[0].id);
    expect(Array.isArray(detail.body.supportingEvents)).toBe(true);
    expect(typeof detail.body.recommendedAction).toBe("string");

    const approve = await request(app).post(`/api/operator/review-queue/${queue.body[0].id}/approve`);
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe("approved");
  });

  it("publishes operator-reviewed top-line metrics", async () => {
    const response = await request(app)
      .post("/api/operator/topline-metrics/hormuz_daily_cap")
      .send({
        value: 18,
        valueText: "<=18/day",
        sourceText: "Kpler / operator review",
        confidence: "reported",
        note: "Reviewed after the latest shipping corridor update."
      });

    expect(response.status).toBe(200);
    expect(response.body.key).toBe("hormuz_daily_cap");
    expect(response.body.current.valueText).toBe("<=18/day");
    expect(response.body.current.freshness).toBe("operator_reviewed");

    await request(app).post("/api/operator/topline-metrics/total_strikes").send({
      value: 13420,
      valueText: ">13,400",
      sourceText: "CENTCOM / operator review",
      confidence: "reported",
      note: ""
    });
    await request(app).post("/api/operator/topline-metrics/oil_brent").send({
      value: 102.01,
      valueText: "$102.01",
      sourceText: "Yahoo Finance / operator review",
      confidence: "confirmed",
      note: ""
    });
    await request(app).post("/api/operator/topline-metrics/iran_casualties_estimate").send({
      value: 21500,
      valueText: "21,500+ Iran alone",
      sourceText: "Reuters / operator review",
      confidence: "reported",
      note: ""
    });

    const overview = await request(app).get("/api/overview");
    expect(overview.status).toBe(200);
    expect(overview.body.stale).toBe(false);
    expect(overview.body.freshness.topLine).toBe("operator_reviewed");
  });

  it("exposes operator top-line suggestions", async () => {
    const response = await request(app).get("/api/operator/topline-suggestions");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("exposes operator synthesis suggestions", async () => {
    const response = await request(app).get("/api/operator/synthesis");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.stories)).toBe(true);
    expect(Array.isArray(response.body.claims)).toBe(true);
  });
});
