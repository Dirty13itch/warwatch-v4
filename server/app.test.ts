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

  it("exposes operator queue and can approve seeded queue items", async () => {
    const queue = await request(app).get("/api/operator/review-queue");
    expect(queue.status).toBe(200);
    expect(queue.body.length).toBeGreaterThan(0);

    const approve = await request(app).post(`/api/operator/review-queue/${queue.body[0].id}/approve`);
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe("approved");
  });

  it("publishes operator-reviewed top-line metrics", async () => {
    const response = await request(app)
      .post("/api/operator/topline-metrics/hormuz_daily_cap")
      .send({
        value: 18,
        valueText: "≤18/day",
        sourceText: "Kpler / operator review",
        confidence: "reported",
        note: "Reviewed after the latest shipping corridor update."
      });

    expect(response.status).toBe(200);
    expect(response.body.key).toBe("hormuz_daily_cap");
    expect(response.body.current.valueText).toBe("≤18/day");
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
});
