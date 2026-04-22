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
});

