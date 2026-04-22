import crypto from "node:crypto";
import Parser from "rss-parser";
import type { DatabaseSync } from "node:sqlite";
import {
  classifyFeedEvent,
  earthquakeSignificance
} from "./db.js";
import {
  initialReviewState,
  initialVisibility,
  severityFromSignificance
} from "../shared/review.js";

const parser = new Parser();

function toId(prefix: string, value: string): string {
  return `${prefix}_${crypto.createHash("sha1").update(value).digest("hex").slice(0, 12)}`;
}

export const feedDefinitions = [
  { name: "BBC Middle East", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", runType: "rss" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", runType: "rss" },
  { name: "Reuters", url: "https://feeds.reuters.com/reuters/topNews", runType: "rss" },
  { name: "Defense News", url: "https://www.defensenews.com/arc/outboundfeeds/rss/", runType: "rss" },
  { name: "USNI News", url: "https://news.usni.org/feed", runType: "rss" },
  {
    name: "USGS Iran Earthquakes",
    url: "https://earthquake.usgs.gov/fdsnws/event/1/query.geojson?starttime=2026-02-28&minmagnitude=4&minlatitude=24&maxlatitude=41&minlongitude=44&maxlongitude=64&orderby=time",
    runType: "usgs"
  }
] as const;

export async function runIngestionCycle(db: DatabaseSync): Promise<void> {
  for (const feed of feedDefinitions) {
    const startedAt = new Date().toISOString();
    const runId = toId("run", `${feed.name}:${startedAt}`);
    let insertedCount = 0;
    let queuedCount = 0;
    let status: "success" | "partial" | "error" = "success";
    let summary = "No new records";
    let errorText: string | null = null;

    try {
      if (feed.runType === "rss") {
        const parsed = await parser.parseURL(feed.url);
        const items = parsed.items.slice(0, 10);
        for (const item of items) {
          const title = item.title?.trim();
          if (!title) {
            continue;
          }

          const fingerprint = `${feed.name}:${title}:${item.pubDate ?? item.isoDate ?? ""}`;
          const eventId = toId("event", fingerprint);
          const exists = db.prepare(`SELECT id FROM events WHERE id = ?`).get(eventId) as { id?: string } | undefined;
          if (exists?.id) {
            continue;
          }

          const detail = item.contentSnippet?.trim() || item.content?.slice(0, 420) || "Auto-ingested feed item.";
          const classified = classifyFeedEvent(`${title} ${detail}`);
          const reviewState = initialReviewState(classified.significance, "ingest");
          const visibility = initialVisibility(classified.significance, "ingest");
          const eventDate = (item.isoDate ?? item.pubDate ?? new Date().toISOString()).slice(0, 10);

          db.prepare(`
            INSERT INTO events (
              id, date, time, title, detail, category, significance, confidence, corroboration,
              source_text, source_refs_json, review_state, visibility, geo_json, tags_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            eventId,
            eventDate,
            null,
            title,
            detail,
            classified.category,
            classified.significance,
            "unverified",
            1,
            feed.name,
            JSON.stringify([feed.name, item.link].filter(Boolean)),
            reviewState,
            visibility,
            null,
            JSON.stringify(["auto_ingest", feed.name]),
            new Date().toISOString()
          );
          insertedCount += 1;

          if (reviewState === "pending") {
            const queueId = toId("queue", eventId);
            db.prepare(`
              INSERT OR IGNORE INTO review_queue (
                id, item_type, item_id, title, severity, reason, status, created_at, updated_at, metadata_json
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              queueId,
              "event",
              eventId,
              title,
              severityFromSignificance(classified.significance),
              "Critical auto-ingested event requires human review before public promotion.",
              "pending",
              startedAt,
              startedAt,
              JSON.stringify({ feed: feed.name, link: item.link ?? null })
            );
            queuedCount += 1;
          }
        }
      } else {
        const response = await fetch(feed.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as {
          features?: Array<{
            id: string;
            geometry: { coordinates: [number, number, number] };
            properties: { mag: number; place: string; time: number };
          }>;
        };

        for (const feature of payload.features?.slice(0, 10) ?? []) {
          const eventId = toId("event", `${feed.name}:${feature.id}`);
          const exists = db.prepare(`SELECT id FROM events WHERE id = ?`).get(eventId) as { id?: string } | undefined;
          if (exists?.id) {
            continue;
          }

          const significance = earthquakeSignificance(feature.properties.mag);
          const reviewState = initialReviewState(significance, "ingest");
          const visibility = initialVisibility(significance, "ingest");
          const occurredAt = new Date(feature.properties.time).toISOString();
          const title = `Seismic event M${feature.properties.mag.toFixed(1)} near ${feature.properties.place}`;
          db.prepare(`
            INSERT INTO events (
              id, date, time, title, detail, category, significance, confidence, corroboration,
              source_text, source_refs_json, review_state, visibility, geo_json, tags_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            eventId,
            occurredAt.slice(0, 10),
            occurredAt.slice(11, 16) + "Z",
            title,
            "USGS seismic monitor item. Public shell should treat seismic signals as monitoring intelligence, not causal proof.",
            "seismic",
            significance,
            "auto_extracted",
            1,
            feed.name,
            JSON.stringify([feed.name]),
            reviewState,
            visibility,
            JSON.stringify({
              lat: feature.geometry.coordinates[1],
              lon: feature.geometry.coordinates[0]
            }),
            JSON.stringify(["auto_ingest", "usgs"]),
            occurredAt
          );
          insertedCount += 1;
        }
      }

      summary = insertedCount
        ? `Inserted ${insertedCount} items; queued ${queuedCount} for review`
        : "No new events were inserted";
    } catch (error) {
      status = "error";
      summary = "Ingestion failed";
      errorText = error instanceof Error ? error.message : String(error);
    }

    db.prepare(`
      INSERT INTO ingestion_runs (
        id, feed_name, run_type, status, started_at, finished_at, summary, inserted_count, queued_count, error_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      runId,
      feed.name,
      feed.runType,
      status,
      startedAt,
      new Date().toISOString(),
      summary,
      insertedCount,
      queuedCount,
      errorText
    );
  }
}
