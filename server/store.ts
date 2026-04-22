import type { DatabaseSync } from "node:sqlite";
import { CONFLICT_START_ISO } from "./config.js";
import { canPublish } from "../shared/review.js";
import { topLineMetricDefinitions } from "../shared/topline.js";
import type {
  BriefingRecord,
  ClaimRecord,
  EventRecord,
  IngestionRun,
  MapFeature,
  MetricSnapshot,
  OperatorTopLineMetric,
  OverviewResponse,
  ReviewQueueDetail,
  ReviewQueueItem,
  ReviewQueueSummary,
  SourceRecord,
  StoryRecord
} from "../shared/types.js";

function parseJson<T>(value: string | null): T {
  return JSON.parse(value ?? "null") as T;
}

function rowToEvent(row: Record<string, any>): EventRecord {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    title: row.title,
    detail: row.detail,
    category: row.category,
    significance: row.significance,
    confidence: row.confidence,
    corroboration: Number(row.corroboration),
    sourceText: row.source_text,
    sourceRefs: parseJson<string[]>(row.source_refs_json),
    reviewState: row.review_state,
    visibility: row.visibility,
    geo: parseJson(row.geo_json),
    tags: parseJson<string[]>(row.tags_json),
    createdAt: row.created_at
  };
}

function rowToMetric(row: Record<string, any>): MetricSnapshot {
  return {
    id: row.id,
    metricKey: row.metric_key,
    value: row.value,
    valueText: row.value_text,
    unit: row.unit,
    timestamp: row.timestamp,
    sourceText: row.source_text,
    confidence: row.confidence,
    reviewState: row.review_state,
    freshness: row.freshness,
    meta: parseJson<Record<string, unknown>>(row.meta_json)
  };
}

function getLatestMetricSnapshot(db: DatabaseSync, key: string): MetricSnapshot | null {
  const row = db.prepare(`
    SELECT *
    FROM metrics
    WHERE metric_key = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `).get(key) as Record<string, any> | undefined;

  return row ? rowToMetric(row) : null;
}

function rowToStory(row: Record<string, any>): StoryRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    section: row.section,
    summary: row.summary,
    detail: row.detail,
    significance: row.significance,
    sourceText: row.source_text,
    reviewState: row.review_state,
    meta: parseJson<Record<string, unknown>>(row.meta_json)
  };
}

function rowToClaim(row: Record<string, any>): ClaimRecord {
  return {
    id: row.id,
    title: row.title,
    statement: row.statement,
    status: row.status,
    significance: row.significance,
    confidence: row.confidence,
    evidenceRefs: parseJson<string[]>(row.evidence_refs_json),
    reviewState: row.review_state,
    lastReviewedAt: row.last_reviewed_at
  };
}

function rowToSource(row: Record<string, any>): SourceRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    reliabilityScore: Number(row.reliability_score),
    biasDirection: row.bias_direction,
    notes: row.notes,
    reviewState: row.review_state
  };
}

function rowToBriefing(row: Record<string, any>): BriefingRecord {
  return {
    id: row.id,
    briefingDate: row.briefing_date,
    title: row.title,
    body: row.body,
    sourceRefs: parseJson<string[]>(row.source_refs_json),
    reviewState: row.review_state,
    publishState: row.publish_state,
    createdAt: row.created_at
  };
}

function rowToQueue(row: Record<string, any>): ReviewQueueItem {
  const ageHours = Math.max(0, (Date.now() - Date.parse(row.created_at)) / 3_600_000);
  return {
    id: row.id,
    itemType: row.item_type,
    itemId: row.item_id,
    title: row.title,
    severity: row.severity,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: parseJson<Record<string, unknown>>(row.metadata_json),
    ageHours,
    ageBucket: ageHours >= 72 ? "stale" : ageHours >= 24 ? "aging" : "fresh"
  };
}

function getClaimById(db: DatabaseSync, id: string): ClaimRecord | null {
  const row = db.prepare(`SELECT * FROM claims WHERE id = ?`).get(id) as Record<string, any> | undefined;
  return row ? rowToClaim(row) : null;
}

function getBriefingById(db: DatabaseSync, id: string): BriefingRecord | null {
  const row = db.prepare(`SELECT * FROM briefings WHERE id = ?`).get(id) as Record<string, any> | undefined;
  return row ? rowToBriefing(row) : null;
}

function buildKeywordSet(values: Array<string | null | undefined>): string[] {
  const stopWords = new Set([
    "about",
    "after",
    "before",
    "build",
    "current",
    "event",
    "first",
    "from",
    "have",
    "into",
    "needs",
    "news",
    "public",
    "refresh",
    "requires",
    "review",
    "should",
    "source",
    "sources",
    "status",
    "that",
    "their",
    "this",
    "what",
    "with"
  ]);

  return Array.from(
    new Set(
      values
        .flatMap((value) =>
          String(value ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .split(/\s+/)
            .filter((token) => token.length >= 4 && !stopWords.has(token))
        )
    )
  );
}

function rankMatchingEvents(
  db: DatabaseSync,
  refs: string[],
  values: Array<string | null | undefined>,
  excludeIds: string[] = []
): EventRecord[] {
  const excluded = new Set(excludeIds);
  const rows = db.prepare(`
    SELECT * FROM events
    ORDER BY date DESC, COALESCE(time, '00:00Z') DESC
    LIMIT 120
  `).all() as Record<string, any>[];
  const events = rows.map(rowToEvent).filter((event) => !excluded.has(event.id));
  const byId = new Map<string, EventRecord>();

  for (const ref of refs.filter(Boolean)) {
    const normalizedRef = ref.toLowerCase();
    const match = events.find(
      (event) =>
        event.title.toLowerCase() === normalizedRef ||
        event.title.toLowerCase().includes(normalizedRef)
    );
    if (match) {
      byId.set(match.id, match);
    }
  }

  const keywords = buildKeywordSet(values);
  const scored = events
    .map((event) => {
      const haystack = `${event.title} ${event.detail} ${event.sourceText} ${event.tags.join(" ")}`.toLowerCase();
      let score = byId.has(event.id) ? 100 : 0;
      for (const keyword of keywords) {
        if (event.title.toLowerCase().includes(keyword)) {
          score += 4;
        } else if (haystack.includes(keyword)) {
          score += 1;
        }
      }

      return { event, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || right.event.corroboration - left.event.corroboration)
    .map((entry) => entry.event);

  for (const event of scored) {
    byId.set(event.id, event);
  }

  return Array.from(byId.values()).slice(0, 4);
}

function getSupersedingBriefing(db: DatabaseSync, briefingId: string): BriefingRecord | null {
  const row = db.prepare(`
    SELECT * FROM briefings
    WHERE id <> ? AND publish_state = 'published' AND review_state = 'approved'
    ORDER BY briefing_date DESC, created_at DESC
    LIMIT 1
  `).get(briefingId) as Record<string, any> | undefined;

  return row ? rowToBriefing(row) : null;
}

function reviewRecommendation(detail: {
  itemType: string;
  claim: ClaimRecord | null;
  briefing: BriefingRecord | null;
  supersedingBriefing: BriefingRecord | null;
}): string {
  if (detail.itemType === "event") {
    return "Review the auto-ingested event, confirm conflict relevance and factual accuracy, then approve for public promotion or reject it.";
  }

  if (detail.itemType === "claim") {
    if (detail.claim?.reviewState === "pending") {
      return "Compare this seeded critical claim against current reviewed events and publish a refreshed operator-backed posture before approving it.";
    }

    return "Revalidate the claim against current reviewed evidence before changing its public posture.";
  }

  if (detail.itemType === "briefing") {
    if (detail.supersedingBriefing) {
      return "A newer approved SITREP now exists. Decide whether this seeded launch briefing should stay public, be demoted, or be rejected as superseded.";
    }

    return "Replace this seeded briefing with a current-source SITREP before keeping it in the public archive.";
  }

  return "Review the canonical object and resolve whether it should be promoted, revised, or rejected.";
}

function rowToIngestionRun(row: Record<string, any>): IngestionRun {
  return {
    id: row.id,
    feedName: row.feed_name,
    runType: row.run_type,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    summary: row.summary,
    insertedCount: Number(row.inserted_count),
    queuedCount: Number(row.queued_count),
    errorText: row.error_text
  };
}

function rowToMapFeature(row: Record<string, any>): MapFeature {
  return {
    id: row.id,
    layerKey: row.layer_key,
    title: row.title,
    kind: row.kind,
    lat: Number(row.lat),
    lon: Number(row.lon),
    severity: row.severity,
    status: row.status,
    sourceText: row.source_text,
    reviewState: row.review_state,
    meta: parseJson<Record<string, unknown>>(row.meta_json)
  };
}

export function getOverview(db: DatabaseSync): OverviewResponse {
  const metricRows = db.prepare(`
    SELECT m.*
    FROM metrics m
    INNER JOIN (
      SELECT metric_key, MAX(timestamp) AS timestamp
      FROM metrics
      GROUP BY metric_key
    ) latest ON latest.metric_key = m.metric_key AND latest.timestamp = m.timestamp
  `).all() as Record<string, any>[];

  const metricMap = new Map(metricRows.map((row) => [row.metric_key, rowToMetric(row)]));
  const fronts = (
    db.prepare(`
      SELECT * FROM stories
      WHERE section = 'front'
      ORDER BY
        CASE significance
          WHEN 'critical' THEN 0
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          ELSE 3
        END,
        title
      LIMIT 5
    `).all() as Record<string, any>[]
  ).map(rowToStory);

  const pendingSummary = db.prepare(`
    SELECT
      COUNT(*) AS pending,
      SUM(CASE WHEN severity = 'critical' AND status = 'pending' THEN 1 ELSE 0 END) AS critical
    FROM review_queue
    WHERE status = 'pending'
  `).get() as { pending: number; critical: number };

  const lastIngestion = db.prepare(`
    SELECT status FROM ingestion_runs
    ORDER BY started_at DESC
    LIMIT 1
  `).get() as { status?: string } | undefined;

  const lastSuccessfulIngestion = db.prepare(`
    SELECT MAX(finished_at) AS latest
    FROM ingestion_runs
    WHERE status = 'success'
  `).get() as { latest: string | null };

  const legacyAsOf = [
    metricMap.get("total_strikes"),
    metricMap.get("oil_brent"),
    metricMap.get("hormuz_daily_cap"),
    metricMap.get("iran_casualties_estimate")
  ]
    .filter((metric): metric is MetricSnapshot => Boolean(metric))
    .filter((metric) => metric.freshness.includes("seed"))
    .map((metric) => metric.timestamp.slice(0, 10))
    .sort()
    .at(-1) ?? null;
  const topLineFreshnesses = [
    metricMap.get("total_strikes")?.freshness ?? "missing",
    metricMap.get("oil_brent")?.freshness ?? "missing",
    metricMap.get("hormuz_daily_cap")?.freshness ?? "missing",
    metricMap.get("iran_casualties_estimate")?.freshness ?? "missing"
  ];
  const topLineFreshness = topLineFreshnesses.includes("missing")
    ? "missing"
    : topLineFreshnesses.every((value) => value === "live" || value === "ingested" || value === "operator_reviewed")
      ? topLineFreshnesses.some((value) => value === "operator_reviewed")
        ? "operator_reviewed"
        : "live"
      : topLineFreshnesses.every((value) => value === "historical_seed")
        ? "historical_seed"
        : topLineFreshnesses.includes("stale_seed")
          ? "stale_seed"
          : "mixed";
  const hasLiveIngestion = Boolean(lastSuccessfulIngestion.latest);
  const stale = !["live", "operator_reviewed"].includes(topLineFreshness);

  const kpis = topLineMetricDefinitions.map((item) => {
    const metric = metricMap.get(item.key);
    let supportingText = item.supportingText;
    if (item.key === "oil_brent" && (metric?.freshness === "live" || metric?.freshness === "ingested")) {
      supportingText = "Live market signal from the Yahoo Finance futures feed.";
    }
    if (metric?.freshness === "operator_reviewed") {
      supportingText = `Operator-reviewed refresh from ${metric.sourceText}.`;
    }

    return {
      key: item.key,
      label: item.label,
      value: metric?.valueText ?? String(metric?.value ?? "n/a"),
      supportingText,
      freshness: metric?.freshness ?? "missing"
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    currentDay: Math.floor((Date.now() - Date.parse(CONFLICT_START_ISO)) / 86_400_000) + 1,
    stale,
    legacyAsOf,
    freshness: {
      topLine: topLineFreshness,
      lastSuccessfulIngestionAt: lastSuccessfulIngestion.latest,
      hasLiveIngestion
    },
    headline: {
      level: metricMap.get("threat_level")?.valueText ?? "CRITICAL",
      label: "Public intelligence shell",
      description:
        "Critical claims are review-gated. Freshness labels remain explicit while live ingestion and runtime verification ramp."
    },
    kpis,
    fronts: fronts.map((front) => ({
      id: front.id,
      title: front.title,
      status: front.summary,
      summary: front.detail,
      significance: front.significance,
      icon: String(front.meta.icon ?? "")
    })),
    queue: {
      pending: Number(pendingSummary.pending ?? 0),
      critical: Number(pendingSummary.critical ?? 0),
      lastIngestionStatus: lastIngestion?.status ?? "seed-only"
    }
  };
}

export function getEvents(
  db: DatabaseSync,
  options: { includeHidden?: boolean; category?: string | null; limit?: number } = {}
): EventRecord[] {
  const rows = db.prepare(`
    SELECT * FROM events
    WHERE ($category IS NULL OR category = $category)
    ORDER BY date DESC, COALESCE(time, '00:00Z') DESC
    LIMIT $limit
  `).all({
    category: options.category ?? null,
    limit: options.limit ?? 200
  }) as Record<string, any>[];

  return rows
    .map(rowToEvent)
    .filter((event) => options.includeHidden || canPublish(event.reviewState, event.visibility));
}

export function getEventById(db: DatabaseSync, id: string): EventRecord | null {
  const row = db.prepare(`SELECT * FROM events WHERE id = ?`).get(id) as Record<string, any> | undefined;
  if (!row) {
    return null;
  }

  return rowToEvent(row);
}

export function getMetricHistory(db: DatabaseSync, key: string): MetricSnapshot[] {
  const rows = db.prepare(`
    SELECT * FROM metrics
    WHERE metric_key = ?
    ORDER BY timestamp ASC
  `).all(key) as Record<string, any>[];
  return rows.map(rowToMetric);
}

export function getTopLineMetrics(db: DatabaseSync): OperatorTopLineMetric[] {
  return topLineMetricDefinitions.map((definition) => ({
    key: definition.key,
    label: definition.label,
    supportingText: definition.supportingText,
    unit: definition.unit,
    current: getLatestMetricSnapshot(db, definition.key)
  }));
}

export function getBriefings(db: DatabaseSync): BriefingRecord[] {
  return (
    db.prepare(`
      SELECT * FROM briefings
      WHERE publish_state = 'published'
      ORDER BY briefing_date DESC
    `).all() as Record<string, any>[]
  ).map(rowToBriefing);
}

export function getStories(db: DatabaseSync, section?: string): StoryRecord[] {
  return (
    db.prepare(`
      SELECT * FROM stories
      WHERE ($section IS NULL OR section = $section)
      ORDER BY
        CASE significance
          WHEN 'critical' THEN 0
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          ELSE 3
        END,
        title
    `).all({ section: section ?? null }) as Record<string, any>[]
  ).map(rowToStory);
}

export function getSources(db: DatabaseSync): SourceRecord[] {
  return (
    db.prepare(`
      SELECT * FROM sources
      ORDER BY reliability_score DESC, name ASC
    `).all() as Record<string, any>[]
  ).map(rowToSource);
}

export function getMapLayers(db: DatabaseSync): Record<string, MapFeature[]> {
  const rows = (
    db.prepare(`
      SELECT * FROM map_features
      WHERE review_state <> 'rejected'
      ORDER BY layer_key, title
    `).all() as Record<string, any>[]
  ).map(rowToMapFeature);

  return rows.reduce<Record<string, MapFeature[]>>((acc, row) => {
    acc[row.layerKey] ??= [];
    acc[row.layerKey].push(row);
    return acc;
  }, {});
}

export function getReviewQueue(db: DatabaseSync): ReviewQueueItem[] {
  return (
    db.prepare(`
      SELECT * FROM review_queue
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 0
          WHEN 'high' THEN 1
          ELSE 2
        END,
        created_at DESC
    `).all() as Record<string, any>[]
  ).map(rowToQueue);
}

export function getReviewQueueSummary(db: DatabaseSync): ReviewQueueSummary {
  const row = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'pending' AND severity = 'critical' THEN 1 ELSE 0 END) AS critical,
      SUM(CASE WHEN status = 'pending' AND ((julianday('now') - julianday(created_at)) * 24) >= 24 THEN 1 ELSE 0 END) AS older_than_24h,
      SUM(CASE WHEN status = 'pending' AND ((julianday('now') - julianday(created_at)) * 24) >= 72 THEN 1 ELSE 0 END) AS older_than_72h,
      MAX(CASE WHEN status = 'pending' THEN ((julianday('now') - julianday(created_at)) * 24) ELSE NULL END) AS oldest_pending_hours
    FROM review_queue
  `).get() as {
    pending: number | null;
    critical: number | null;
    older_than_24h: number | null;
    older_than_72h: number | null;
    oldest_pending_hours: number | null;
  };

  return {
    pending: Number(row.pending ?? 0),
    critical: Number(row.critical ?? 0),
    olderThan24h: Number(row.older_than_24h ?? 0),
    olderThan72h: Number(row.older_than_72h ?? 0),
    oldestPendingHours: row.oldest_pending_hours === null ? null : Number(row.oldest_pending_hours)
  };
}

export function getReviewQueueDetail(db: DatabaseSync, queueId: string): ReviewQueueDetail | null {
  const row = db.prepare(`SELECT * FROM review_queue WHERE id = ?`).get(queueId) as Record<string, any> | undefined;
  if (!row) {
    return null;
  }

  const item = rowToQueue(row);
  const metadata = parseJson<Record<string, string | boolean>>(row.metadata_json);
  const event = item.itemType === "event" ? getEventById(db, item.itemId) : null;
  const claim = item.itemType === "claim" ? getClaimById(db, item.itemId) : null;
  const briefing = item.itemType === "briefing" ? getBriefingById(db, item.itemId) : null;
  const supersedingBriefing = briefing ? getSupersedingBriefing(db, briefing.id) : null;

  const supportingEvents =
    event
      ? [event]
      : claim
        ? rankMatchingEvents(db, claim.evidenceRefs, [claim.title, claim.status, claim.statement])
        : briefing
          ? rankMatchingEvents(db, briefing.sourceRefs, [briefing.title, briefing.body], [])
          : [];

  return {
    item,
    event,
    claim,
    briefing,
    supportingEvents,
    supersedingBriefing,
    feedName: typeof metadata.feed === "string" ? metadata.feed : null,
    externalLink: typeof metadata.link === "string" ? metadata.link : null,
    recommendedAction: reviewRecommendation({
      itemType: item.itemType,
      claim,
      briefing,
      supersedingBriefing
    })
  };
}

export function getIngestionRuns(db: DatabaseSync): IngestionRun[] {
  return (
    db.prepare(`
      SELECT * FROM ingestion_runs
      ORDER BY started_at DESC
      LIMIT 40
    `).all() as Record<string, any>[]
  ).map(rowToIngestionRun);
}

export function setQueueStatus(
  db: DatabaseSync,
  queueId: string,
  status: "approved" | "rejected"
): ReviewQueueItem | null {
  const queue = db.prepare(`SELECT * FROM review_queue WHERE id = ?`).get(queueId) as Record<string, any> | undefined;
  if (!queue) {
    return null;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE review_queue
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(status, now, queueId);

  if (queue.item_type === "event") {
    db.prepare(`
      UPDATE events
      SET review_state = ?, visibility = ?
      WHERE id = ?
    `).run(status === "approved" ? "approved" : "rejected", status === "approved" ? "primary" : "review_only", queue.item_id);
  }

  if (queue.item_type === "claim") {
    db.prepare(`
      UPDATE claims
      SET review_state = ?, last_reviewed_at = ?
      WHERE id = ?
    `).run(status === "approved" ? "approved" : "rejected", now, queue.item_id);
  }

  if (queue.item_type === "briefing") {
    db.prepare(`
      UPDATE briefings
      SET review_state = ?, publish_state = ?
      WHERE id = ?
    `).run(status === "approved" ? "approved" : "rejected", status === "approved" ? "published" : "draft", queue.item_id);
  }

  const updated = db.prepare(`SELECT * FROM review_queue WHERE id = ?`).get(queueId) as Record<string, any>;
  return rowToQueue(updated);
}
