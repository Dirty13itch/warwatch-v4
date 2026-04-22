import type { DatabaseSync } from "node:sqlite";
import { getTopLineMetricDefinition } from "../shared/topline.js";
import type {
  EventRecord,
  OperatorMetricPublishInput,
  OperatorSuggestionEvidence,
  OperatorTopLineSuggestion,
  OperatorTopLineMetric,
  TopLineMetricKey
} from "../shared/types.js";
import { getTopLineMetrics } from "./store.js";

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

function eventMatchesMetric(key: TopLineMetricKey, event: EventRecord): boolean {
  const haystack = `${event.title} ${event.detail}`;

  if (key === "total_strikes") {
    return (
      /[0-9][0-9,]{2,}\+?\s+(?:strikes|sorties)/i.test(haystack) ||
      /(?:total|cumulative|combined|campaign|air campaign).{0,40}(?:strikes|sorties)/i.test(haystack) ||
      /(?:strikes|sorties).{0,40}(?:total|cumulative|combined|campaign|all theaters)/i.test(haystack)
    );
  }

  if (key === "hormuz_daily_cap") {
    return /(hormuz|strait of hormuz|shipping corridor|tanker|throughput|vessels?\s+(?:per day|a day|daily)|ships?\s+(?:per day|a day|daily))/i.test(haystack);
  }

  if (key === "iran_casualties_estimate") {
    return /(?:iran|iranian|irgc).{0,40}(?:casualt|killed|dead|deaths|fatalit)|(?:casualt|killed|dead|deaths|fatalit).{0,40}(?:iran|iranian|irgc)/i.test(haystack);
  }

  return /(brent|oil|crude|barrel|market|wti)/i.test(haystack);
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
      haystack.match(/(?:≤|<=|up to|max(?:imum)?|cap(?:ped)?(?: at)?|only)\s*([0-9]{1,3})\s*(?:\/day|per day|ships\/day|vessels\/day)/i) ??
      haystack.match(/([0-9]{1,3})\s+(?:ships|vessels)\s+(?:yesterday|a day|per day|daily|passed)/i);
    if (!match) {
      return null;
    }

    const value = Number(match[1]);
    return {
      value,
      valueText: `≤${value}/day`,
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
  recentEvents: EventRecord[]
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

  const relevantEvents = recentEvents.filter((event) => eventMatchesMetric(metric.key, event));
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
  return metrics.map((metric) => buildSuggestion(metric, recentEvents));
}
