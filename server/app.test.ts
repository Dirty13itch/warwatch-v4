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

  it("publishes reviewed holds when current public numbers are not yet defensible", async () => {
    const strikeHold = await request(app)
      .post("/api/operator/topline-metrics/total_strikes")
      .send({
        mode: "hold"
      });

    expect(strikeHold.status).toBe(200);
    expect(strikeHold.body.current.valueText).toBe("Awaiting reviewed cumulative strike total");
    expect(strikeHold.body.current.freshness).toBe("operator_hold");

    await request(app)
      .post("/api/operator/topline-metrics/hormuz_daily_cap")
      .send({
        mode: "hold"
      });

    await request(app)
      .post("/api/operator/topline-metrics/iran_casualties_estimate")
      .send({
        mode: "hold"
      });

    await request(app)
      .post("/api/operator/topline-metrics/oil_brent")
      .send({
        value: 102.01,
        valueText: "$102.01",
        sourceText: "Yahoo Finance / operator review",
        confidence: "confirmed",
        note: ""
      });

    const overview = await request(app).get("/api/overview");
    expect(overview.status).toBe(200);
    expect(overview.body.stale).toBe(true);
    expect(overview.body.freshness.topLine).toBe("review_hold");
    expect(overview.body.kpis.find((item: { key: string }) => item.key === "total_strikes").freshness).toBe("operator_hold");
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
    expect(response.body.stories.length).toBeGreaterThan(0);
    expect(response.body.claims.length).toBeGreaterThan(0);
  });

  it("queues and approves synthesis suggestions into canonical records", async () => {
    const synthesis = await request(app).get("/api/operator/synthesis");
    const storySuggestion = synthesis.body.stories[0];
    const claimSuggestion = synthesis.body.claims[0];

    const queuedStory = await request(app)
      .post(`/api/operator/synthesis/stories/${encodeURIComponent(storySuggestion.id)}/queue`);
    expect(queuedStory.status).toBe(200);
    expect(queuedStory.body.itemType).toBe("story_suggestion");

    const synthesisAfterStoryQueue = await request(app).get("/api/operator/synthesis");
    const queuedStorySuggestion = synthesisAfterStoryQueue.body.stories.find(
      (item: { id: string; queueId: string | null }) => item.id === storySuggestion.id
    );
    expect(queuedStorySuggestion?.queueId).toBe(queuedStory.body.id);

    const storyDetail = await request(app).get(`/api/operator/review-queue/${queuedStory.body.id}`);
    expect(storyDetail.status).toBe(200);
    expect(storyDetail.body.storySuggestion.id).toBe(storySuggestion.id);
    expect(Array.isArray(storyDetail.body.supportingEvents)).toBe(true);

    const approveStory = await request(app).post(`/api/operator/review-queue/${queuedStory.body.id}/approve`);
    expect(approveStory.status).toBe(200);
    expect(approveStory.body.status).toBe("approved");

    const stories = await request(app).get("/api/stories");
    const promotedStory = stories.body.find((item: { title: string; reviewState: string }) => item.title === storySuggestion.title);
    expect(promotedStory).toBeTruthy();
    expect(promotedStory.reviewState).toBe("approved");

    const queuedClaim = await request(app)
      .post(`/api/operator/synthesis/claims/${encodeURIComponent(claimSuggestion.id)}/queue`);
    expect(queuedClaim.status).toBe(200);
    expect(queuedClaim.body.itemType).toBe("claim_suggestion");

    const claimDetail = await request(app).get(`/api/operator/review-queue/${queuedClaim.body.id}`);
    expect(claimDetail.status).toBe(200);
    expect(claimDetail.body.claimSuggestion.id).toBe(claimSuggestion.id);
    expect(Array.isArray(claimDetail.body.supportingEvents)).toBe(true);

    const approveClaim = await request(app).post(`/api/operator/review-queue/${queuedClaim.body.id}/approve`);
    expect(approveClaim.status).toBe(200);
    expect(approveClaim.body.status).toBe("approved");

    const graph = await request(app).get("/api/graph");
    const promotedClaim = graph.body.claims.find((item: { title: string; reviewState: string }) => item.title === claimSuggestion.title);
    expect(promotedClaim).toBeTruthy();
    expect(promotedClaim.reviewState).toBe("approved");
  });

  it("requires an operator key once the app has a public base URL", async () => {
    const securedApp = createApp(db, {
      ...config,
      publicBaseUrl: "https://warwatch.example",
      operatorApiKey: "test-operator-key",
      enableScheduler: false
    });

    const denied = await request(securedApp).get("/api/operator/review-queue");
    expect(denied.status).toBe(401);

    const allowed = await request(securedApp)
      .get("/api/operator/review-queue")
      .set("x-warwatch-operator-key", "test-operator-key");
    expect(allowed.status).toBe(200);
  });
});
