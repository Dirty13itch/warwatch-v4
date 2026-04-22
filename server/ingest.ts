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

const MARKET_SOURCE_NAME = "Yahoo Finance";

function toId(prefix: string, value: string): string {
  return `${prefix}_${crypto.createHash("sha1").update(value).digest("hex").slice(0, 12)}`;
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(breaking|live|update|analysis|watch)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveConfidenceFromCorroboration(count: number) {
  if (count >= 3) {
    return "confirmed" as const;
  }

  if (count >= 2) {
    return "reported" as const;
  }

  return "unverified" as const;
}

interface PreparedFeedEvent {
  eventDate: string;
  title: string;
  detail: string;
  category: string;
  significance: "critical" | "high" | "medium" | "watch";
  feedName: string;
  link: string | null;
  createdAt: string;
}

export interface PreparedMetricSnapshot {
  metricKey: string;
  value: number;
  valueText: string;
  unit: string;
  timestamp: string;
  sourceText: string;
  confidence: "confirmed" | "reported";
  reviewState: "approved";
  freshness: "ingested" | "live";
  meta: Record<string, unknown>;
}

interface MarketSignalDefinition {
  feedName: string;
  metricKey: string;
  symbol: string;
  unit: string;
  decimals: number;
}

interface YahooChartPayload {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        exchangeName?: string;
        regularMarketPrice?: number;
        regularMarketTime?: number;
        symbol?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
}

const marketSignalDefinitions: MarketSignalDefinition[] = [
  {
    feedName: "Yahoo Finance Brent",
    metricKey: "oil_brent",
    symbol: "BZ=F",
    unit: "usd_per_barrel",
    decimals: 2
  },
  {
    feedName: "Yahoo Finance WTI",
    metricKey: "oil_wti",
    symbol: "CL=F",
    unit: "usd_per_barrel",
    decimals: 2
  },
  {
    feedName: "Yahoo Finance Gold",
    metricKey: "gold_price",
    symbol: "GC=F",
    unit: "usd_per_ounce",
    decimals: 2
  }
];

function ensureSourceProfile(
  db: DatabaseSync,
  source: {
    name: string;
    slug: string;
    type: string;
    reliabilityScore: number;
    biasDirection: string;
    notes: string;
  }
) {
  db.prepare(`
    INSERT OR IGNORE INTO sources (
      id, slug, name, type, reliability_score, bias_direction, notes, review_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    toId("src", source.name),
    source.slug,
    source.name,
    source.type,
    source.reliabilityScore,
    source.biasDirection,
    source.notes,
    "approved"
  );
}

function formatCurrencyValue(value: number, decimals: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function upsertPreparedMetricSnapshot(
  db: DatabaseSync,
  candidate: PreparedMetricSnapshot
): { action: "inserted" | "updated" | "noop" } {
  const id = toId("metric", `${candidate.metricKey}:${candidate.timestamp}:${candidate.sourceText}`);
  const existing = db.prepare(`
    SELECT value, value_text, unit, confidence, review_state, freshness, meta_json
    FROM metrics
    WHERE id = ?
  `).get(id) as {
    value: number | null;
    value_text: string | null;
    unit: string | null;
    confidence: string;
    review_state: string;
    freshness: string;
    meta_json: string;
  } | undefined;

  const metaJson = JSON.stringify(candidate.meta ?? {});
  if (
    existing &&
    existing.value === candidate.value &&
    existing.value_text === candidate.valueText &&
    existing.unit === candidate.unit &&
    existing.confidence === candidate.confidence &&
    existing.review_state === candidate.reviewState &&
    existing.freshness === candidate.freshness &&
    existing.meta_json === metaJson
  ) {
    return { action: "noop" };
  }

  db.prepare(`
    INSERT OR REPLACE INTO metrics (
      id, metric_key, value, value_text, unit, timestamp, source_text, confidence, review_state, freshness, meta_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    candidate.metricKey,
    candidate.value,
    candidate.valueText,
    candidate.unit,
    candidate.timestamp,
    candidate.sourceText,
    candidate.confidence,
    candidate.reviewState,
    candidate.freshness,
    metaJson
  );

  return { action: existing ? "updated" : "inserted" };
}

export function extractYahooMetricSnapshots(
  definition: MarketSignalDefinition,
  payload: YahooChartPayload
): PreparedMetricSnapshot[] {
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const currency = result?.meta?.currency ?? "USD";
  const exchange = result?.meta?.exchangeName ?? "unknown";
  const symbol = result?.meta?.symbol ?? definition.symbol;

  return timestamps.flatMap((timestamp, index) => {
    const close = closes[index];
    if (!Number.isFinite(close)) {
      return [];
    }

    return [
      {
        metricKey: definition.metricKey,
        value: Number(close),
        valueText: formatCurrencyValue(Number(close), definition.decimals),
        unit: definition.unit,
        timestamp: new Date(timestamp * 1000).toISOString(),
        sourceText: MARKET_SOURCE_NAME,
        confidence: "confirmed",
        reviewState: "approved",
        freshness: "ingested",
        meta: {
          symbol,
          currency,
          exchange
        }
      }
    ];
  });
}

function findMatchingEvent(
  db: DatabaseSync,
  candidate: PreparedFeedEvent
): {
  id: string;
  sourceRefs: string[];
  tags: string[];
  corroboration: number;
  sourceText: string;
  reviewState: string;
  visibility: string;
} | null {
  const rows = db.prepare(`
    SELECT id, title, source_refs_json, tags_json, corroboration, source_text, review_state, visibility
    FROM events
    WHERE date BETWEEN date($date, '-1 day') AND date($date, '+1 day')
      AND category = $category
  `).all({
    date: candidate.eventDate,
    category: candidate.category
  }) as Array<{
    id: string;
    title: string;
    source_refs_json: string;
    tags_json: string;
    corroboration: number;
    source_text: string;
    review_state: string;
    visibility: string;
  }>;

  const normalizedCandidate = normalizeForMatch(candidate.title);
  for (const row of rows) {
    const normalizedExisting = normalizeForMatch(row.title);
    if (!normalizedExisting || !normalizedCandidate) {
      continue;
    }

    if (
      normalizedExisting === normalizedCandidate ||
      normalizedExisting.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedExisting)
    ) {
      return {
        id: row.id,
        sourceRefs: JSON.parse(row.source_refs_json ?? "[]") as string[],
        tags: JSON.parse(row.tags_json ?? "[]") as string[],
        corroboration: Number(row.corroboration),
        sourceText: row.source_text,
        reviewState: row.review_state,
        visibility: row.visibility
      };
    }
  }

  return null;
}

export function upsertPreparedFeedEvent(
  db: DatabaseSync,
  candidate: PreparedFeedEvent
): { action: "inserted" | "merged" | "noop"; queueCreated: boolean } {
  const matched = findMatchingEvent(db, candidate);
  if (matched) {
    const nextSourceRefs = Array.from(
      new Set([...matched.sourceRefs, candidate.feedName, candidate.link].filter(Boolean))
    );
    const nextTags = Array.from(new Set([...matched.tags, "auto_ingest", candidate.feedName]));
    const nextCorroboration = nextSourceRefs.filter((value) => value && !String(value).startsWith("http")).length;
    const nextConfidence = deriveConfidenceFromCorroboration(Math.max(nextCorroboration, matched.corroboration));
    const nextSourceText = Array.from(
      new Set(
        matched.sourceText
          .split("/")
          .map((value) => value.trim())
          .concat(candidate.feedName)
          .filter(Boolean)
      )
    ).join(" / ");

    db.prepare(`
      UPDATE events
      SET source_refs_json = ?, tags_json = ?, corroboration = ?, confidence = ?, source_text = ?
      WHERE id = ?
    `).run(
      JSON.stringify(nextSourceRefs),
      JSON.stringify(nextTags),
      Math.max(nextCorroboration, matched.corroboration),
      nextConfidence,
      nextSourceText,
      matched.id
    );

    return { action: "merged", queueCreated: false };
  }

  const reviewState = initialReviewState(candidate.significance, "ingest");
  const visibility = initialVisibility(candidate.significance, "ingest");
  const eventId = toId("event", `${candidate.title}:${candidate.eventDate}:${candidate.feedName}`);

  db.prepare(`
    INSERT INTO events (
      id, date, time, title, detail, category, significance, confidence, corroboration,
      source_text, source_refs_json, review_state, visibility, geo_json, tags_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    candidate.eventDate,
    null,
    candidate.title,
    candidate.detail,
    candidate.category,
    candidate.significance,
    "unverified",
    1,
    candidate.feedName,
    JSON.stringify([candidate.feedName, candidate.link].filter(Boolean)),
    reviewState,
    visibility,
    null,
    JSON.stringify(["auto_ingest", candidate.feedName]),
    candidate.createdAt
  );

  let queueCreated = false;
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
      candidate.title,
      severityFromSignificance(candidate.significance),
      "Critical auto-ingested event requires human review before public promotion.",
      "pending",
      candidate.createdAt,
      candidate.createdAt,
      JSON.stringify({ feed: candidate.feedName, link: candidate.link })
    );
    queueCreated = true;
  }

  return { action: "inserted", queueCreated };
}

export const feedDefinitions = [
  { name: "BBC Middle East", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", runType: "rss" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", runType: "rss" },
  { name: "NPR World", url: "https://feeds.npr.org/1004/rss.xml", runType: "rss" },
  { name: "Defense News", url: "https://www.defensenews.com/arc/outboundfeeds/rss/", runType: "rss" },
  { name: "USNI News", url: "https://news.usni.org/feed", runType: "rss" },
  {
    name: "USGS Iran Earthquakes",
    url: "https://earthquake.usgs.gov/fdsnws/event/1/query.geojson?starttime=2026-02-28&minmagnitude=4&minlatitude=24&maxlatitude=41&minlongitude=44&maxlongitude=64&orderby=time",
    runType: "usgs"
  }
] as const;

export async function runIngestionCycle(db: DatabaseSync): Promise<void> {
  ensureSourceProfile(db, {
    name: MARKET_SOURCE_NAME,
    slug: "yahoo-finance",
    type: "dataset",
    reliabilityScore: 0.88,
    biasDirection: "market_data",
    notes: "Structured commodity futures feed used for Brent, WTI, and gold snapshots."
  });

  for (const market of marketSignalDefinitions) {
    const startedAt = new Date().toISOString();
    const runId = toId("run", `${market.feedName}:${startedAt}`);
    let insertedCount = 0;
    let updatedCount = 0;
    let status: "success" | "partial" | "error" = "success";
    let summary = "No market data returned";
    let errorText: string | null = null;

    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(market.symbol)}?interval=1d&range=1mo`,
        {
          headers: {
            "user-agent": "Mozilla/5.0 WarWatch/1.0"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as YahooChartPayload;
      const snapshots = extractYahooMetricSnapshots(market, payload);
      for (const snapshot of snapshots) {
        const result = upsertPreparedMetricSnapshot(db, snapshot);
        if (result.action === "inserted") {
          insertedCount += 1;
        }

        if (result.action === "updated") {
          updatedCount += 1;
        }
      }

      const latest = snapshots.at(-1);
      summary = snapshots.length
        ? `Inserted ${insertedCount}; updated ${updatedCount}; latest ${latest?.valueText ?? "n/a"}`
        : "No market data returned";
    } catch (error) {
      status = "error";
      summary = "Market ingestion failed";
      errorText = error instanceof Error ? error.message : String(error);
    }

    db.prepare(`
      INSERT INTO ingestion_runs (
        id, feed_name, run_type, status, started_at, finished_at, summary, inserted_count, queued_count, error_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      runId,
      market.feedName,
      "market",
      status,
      startedAt,
      new Date().toISOString(),
      summary,
      insertedCount,
      0,
      errorText
    );
  }

  for (const feed of feedDefinitions) {
    const startedAt = new Date().toISOString();
    const runId = toId("run", `${feed.name}:${startedAt}`);
    let insertedCount = 0;
    let mergedCount = 0;
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

          const detail = item.contentSnippet?.trim() || item.content?.slice(0, 420) || "Auto-ingested feed item.";
          const classified = classifyFeedEvent(`${title} ${detail}`);
          const eventDate = (item.isoDate ?? item.pubDate ?? new Date().toISOString()).slice(0, 10);
          const result = upsertPreparedFeedEvent(db, {
            eventDate,
            title,
            detail,
            category: classified.category,
            significance: classified.significance,
            feedName: feed.name,
            link: item.link ?? null,
            createdAt: new Date().toISOString()
          });

          if (result.action === "inserted") {
            insertedCount += 1;
          }

          if (result.action === "merged") {
            mergedCount += 1;
          }

          if (result.queueCreated) {
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

      summary = insertedCount || mergedCount
        ? `Inserted ${insertedCount} items; merged ${mergedCount}; queued ${queuedCount} for review`
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

export { normalizeForMatch, deriveConfidenceFromCorroboration, marketSignalDefinitions };
