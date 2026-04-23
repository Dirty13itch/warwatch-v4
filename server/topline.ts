import type { DatabaseSync } from "node:sqlite";
import { getTopLineMetricDefinition } from "../shared/topline.js";
import { entityTagsForText } from "../shared/entity-matching.js";
import type {
  EntityRecord,
  EventRecord,
  OperatorMetricPublishInput,
  OperatorSuggestionEvidence,
  OperatorTopLineSuggestion,
  OperatorTopLineMetric,
  TopLineMetricKey
} from "../shared/types.js";
import { getEntities, getTopLineMetrics } from "./store.js";

function parseJson<T>(value: string | null): T {
  return JSON.parse(value ?? "null") as T;
}

function rowToEvent(row: Record<string, unknown>): EventRecord {
  return {
    id: String(row.id),
    date: String(row.date),
    time: row.time === null ? null : String(row.time),
    title: String(row.title),
    detail: String(row.detail),
    category: String(row.category),
    significance: row.significance as EventRecord["significance"],
    confidence: row.confidence as EventRecord["confidence"],
    corroboration: Number(row.corroboration),
    sourceText: String(row.source_text),
    sourceRefs: parseJson<string[]>(row.source_refs_json as string | null),
    reviewState: row.review_state as EventRecord["reviewState"],
    visibility: row.visibility as EventRecord["visibility"],
    geo: parseJson(row.geo_json as string | null),
    tags: parseJson<string[]>(row.tags_json as string | null),
    createdAt: String(row.created_at)
  };
}

function loadRecentOperatorEvents(db: DatabaseSync): EventRecord[] {
  const rows = db.prepare(`
    SELECT *
    FROM events
    WHERE review_state <> 'rejected'
    ORDER BY date DESC, COALESCE(time, '00:00Z') DESC, created_at DESC
    LIMIT 80
  `).all() as Record<string, unknown>[];

  return rows.map(rowToEvent);
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function eventEntityTags(event: EventRecord, entities: EntityRecord[]): string[] {
  return uniqueStrings([
    ...event.tags.filter((tag) => tag.startsWith("entity:")),
    ...entityTagsForText(entities, event.title, event.detail, event.sourceText)
  ]);
}

function hasEntityTag(tags: string[], slug: string): boolean {
  return tags.includes(`entity:${slug}`);
}

function hasAnyEntityTag(tags: string[], slugs: string[]): boolean {
  return slugs.some((slug) => hasEntityTag(tags, slug));
}

function metricRelevanceScore(
  key: TopLineMetricKey,
  event: EventRecord,
  entities: EntityRecord[]
): number {
  const haystack = `${event.title} ${event.detail}`;
  const entityTags = eventEntityTags(event, entities);

  if (key === "total_strikes") {
    const hasStrikeFigure = /[0-9][0-9,]{2,}\+?\s+(?:strikes|sorties)/i.test(haystack);
    const hasStrikeContext =
      /(?:total|cumulative|combined|campaign|air campaign).{0,40}(?:strikes|sorties)/i.test(haystack) ||
      /(?:strikes|sorties).{0,40}(?:total|cumulative|combined|campaign|all theaters)/i.test(haystack);
    const hasTheaterActor =
      hasAnyEntityTag(entityTags, ["iran", "israel", "lebanon", "hezbollah", "united-states"]) ||
      /(?:iran|israel|lebanon|hezbollah|united states|u\.s\.)/i.test(haystack);

    if (!hasStrikeFigure && !hasStrikeContext) {
      return 0;
    }

    return (
      (hasStrikeFigure ? 8 : 0) +
      (hasStrikeContext ? 5 : 0) +
      (event.category.endsWith("_strike") ? 3 : 0) +
      (hasTheaterActor ? 4 : 0) +
      Math.min(event.corroboration, 3)
    );
  }

  if (key === "hormuz_daily_cap") {
    const hasHormuz = hasEntityTag(entityTags, "strait-of-hormuz") || /(hormuz|strait of hormuz)/i.test(haystack);
    const hasShippingContext =
      /(shipping corridor|tanker|throughput|transit|vessels?\s+(?:per day|a day|daily)|ships?\s+(?:per day|a day|daily))/i.test(
        haystack
      );
    const hasNumericCap =
      /(?:<=|up to|max(?:imum)?|cap(?:ped)?(?: at)?|only)\s*([0-9]{1,3})\s*(?:\/day|per day|ships\/day|vessels\/day)/i.test(
        haystack
      ) ||
      /([0-9]{1,3})\s+(?:ships|vessels)\s+(?:yesterday|a day|per day|daily|passed)/i.test(haystack);

    if (!hasHormuz || (!hasShippingContext && !hasNumericCap)) {
      return 0;
    }

    return (
      (hasEntityTag(entityTags, "strait-of-hormuz") ? 8 : 0) +
      (/(hormuz|strait of hormuz)/i.test(haystack) ? 6 : 0) +
      (hasShippingContext ? 4 : 0) +
      (hasNumericCap ? 5 : 0) +
      (event.category === "economic" ? 2 : 0) +
      Math.min(event.corroboration, 3)
    );
  }

  if (key === "iran_casualties_estimate") {
    const hasIran = hasEntityTag(entityTags, "iran") || /(?:iran|iranian|irgc)/i.test(haystack);
    const hasCasualtyContext = /(?:casualt|killed|dead|deaths|fatalit)/i.test(haystack);
    const hasCasualtyFigure =
      /([0-9][0-9,]{3,})\+?\s+(?:iran(?:ian)?\s+)?(?:casualties|killed|dead|deaths)/i.test(haystack);

    if (!hasIran || !hasCasualtyContext) {
      return 0;
    }

    return (
      (hasEntityTag(entityTags, "iran") ? 6 : 0) +
      (hasCasualtyContext ? 4 : 0) +
      (hasCasualtyFigure ? 7 : 0) +
      (event.category === "intel" || event.category === "iran_strike" ? 2 : 0) +
      Math.min(event.corroboration, 3)
    );
  }

  if (!/(brent|oil|crude|barrel|market|wti)/i.test(haystack)) {
    return 0;
  }

  return 4 + Math.min(event.corroboration, 3);
}

function excerptForEvent(event: EventRecord): string {
  const combined = `${event.title}. ${event.detail}`.replace(/\s+/g, " ").trim();
  return combined.length > 220 ? `${combined.slice(0, 217)}...` : combined;
}

function evidenceForEvents(events: EventRecord[]): OperatorSuggestionEvidence[] {
  return events.slice(0, 3).map((event) => ({
    eventId: event.id,
    title: event.title,
    date: event.date,
    sourceText: event.sourceText,
    significance: event.significance,
    excerpt: excerptForEvent(event)
  }));
}

function extractCandidate(
  key: TopLineMetricKey,
  event: EventRecord
): OperatorMetricPublishInput | null {
  const haystack = `${event.title} ${event.detail}`;

  if (key === "total_strikes") {
    const match = haystack.match(/(?:over|more than|at least|about|approximately)?\s*([0-9][0-9,]{2,})\+?\s+(?:strikes|sorties)/i);
    if (!match) {
      return null;
    }

    const value = Number(match[1].replace(/,/g, ""));
    return {
      value,
      valueText: `${value.toLocaleString("en-US")} strikes`,
      sourceText: `${event.sourceText} / operator synthesis`,
      confidence: event.corroboration >= 2 ? "reported" : "claimed",
      note: `Candidate extracted from ${event.title}.`
    };
  }

  if (key === "hormuz_daily_cap") {
    const match =
      haystack.match(/(?:<=|up to|max(?:imum)?|cap(?:ped)?(?: at)?|only)\s*([0-9]{1,3})\s*(?:\/day|per day|ships\/day|vessels\/day)/i) ??
      haystack.match(/([0-9]{1,3})\s+(?:ships|vessels)\s+(?:yesterday|a day|per day|daily|passed)/i);
    if (!match) {
      return null;
    }

    const value = Number(match[1]);
    return {
      value,
      valueText: `<=${value}/day`,
      sourceText: `${event.sourceText} / operator synthesis`,
      confidence: event.corroboration >= 2 ? "reported" : "claimed",
      note: `Candidate extracted from ${event.title}.`
    };
  }

  if (key === "iran_casualties_estimate") {
    const match = haystack.match(/([0-9][0-9,]{3,})\+?\s+(?:iran(?:ian)?\s+)?(?:casualties|killed|dead|deaths)/i);
    if (!match) {
      return null;
    }

    const value = Number(match[1].replace(/,/g, ""));
    return {
      value,
      valueText: `${value.toLocaleString("en-US")} Iran alone`,
      sourceText: `${event.sourceText} / operator synthesis`,
      confidence: event.corroboration >= 2 ? "reported" : "claimed",
      note: `Candidate extracted from ${event.title}.`
    };
  }

  return null;
}

function buildSuggestion(
  metric: OperatorTopLineMetric,
  recentEvents: EventRecord[],
  entities: EntityRecord[]
): OperatorTopLineSuggestion {
  const definition = getTopLineMetricDefinition(metric.key);
  const current = metric.current;

  if (current?.freshness === "ingested" || current?.freshness === "live" || current?.freshness === "operator_reviewed") {
    return {
      key: metric.key,
      status: "current",
      summary: `${definition.label} already has a current ${current.freshness} snapshot from ${current.sourceText}.`,
      candidate: null,
      evidence: []
    };
  }

  if (current?.freshness === "operator_hold") {
    return {
      key: metric.key,
      status: "reviewed_hold",
      summary: `${definition.label} is on an operator-reviewed hold because current evidence is not yet defensible enough for public publication.`,
      candidate: null,
      evidence: []
    };
  }

  const relevantEvents = recentEvents
    .map((event) => ({
      event,
      score: metricRelevanceScore(metric.key, event, entities)
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.event.corroboration - left.event.corroboration ||
        right.event.date.localeCompare(left.event.date) ||
        right.event.createdAt.localeCompare(left.event.createdAt)
    )
    .map((entry) => entry.event);
  const evidence = evidenceForEvents(relevantEvents);
  const candidateEvent = relevantEvents.find((event) => extractCandidate(metric.key, event));
  const candidate = candidateEvent ? extractCandidate(metric.key, candidateEvent) : null;

  if (candidate) {
    return {
      key: metric.key,
      status: "candidate",
      summary: `Recent event evidence contains a candidate ${definition.label.toLowerCase()} refresh. Review the extracted value before publishing.`,
      candidate,
      evidence
    };
  }

  if (evidence.length) {
    return {
      key: metric.key,
      status: "context_only",
      summary: `Recent evidence is relevant to ${definition.label.toLowerCase()}, but no safe numeric extraction was found. Review the context and publish manually if warranted.`,
      candidate: null,
      evidence
    };
  }

  return {
    key: metric.key,
    status: "no_signal",
    summary: `No recent event evidence currently supports a reviewed ${definition.label.toLowerCase()} refresh.`,
    candidate: null,
    evidence: []
  };
}

export function getTopLineSuggestions(db: DatabaseSync): OperatorTopLineSuggestion[] {
  const metrics = getTopLineMetrics(db);
  const recentEvents = loadRecentOperatorEvents(db);
  const entities = getEntities(db);
  return metrics.map((metric) => buildSuggestion(metric, recentEvents, entities));
}
