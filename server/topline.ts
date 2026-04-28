import type { DatabaseSync } from "node:sqlite";
import { getTopLineMetricDefinition } from "../shared/topline.js";
import { entityTagsForText } from "../shared/entity-matching.js";
import type {
  BriefingRecord,
  EntityRecord,
  EventRecord,
  OperatorMetricPublishInput,
  OperatorSuggestionEvidence,
  OperatorTopLineSuggestion,
  OperatorTopLineMetric,
  Significance,
  StoryRecord,
  TopLineMetricKey
} from "../shared/types.js";
import { getBriefings, getEntities, getStories, getTopLineMetrics } from "./store.js";

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
    LIMIT 220
  `).all() as Record<string, unknown>[];

  return rows.map(rowToEvent);
}

interface NarrativeSource {
  kind: "story" | "briefing";
  id: string;
  date: string;
  title: string;
  detail: string;
  sourceText: string;
  significance: Significance;
}

interface CandidateMatch {
  candidate: OperatorMetricPublishInput;
  originKind: "event" | "story" | "briefing";
  originTitle: string;
}

function storyToNarrativeSource(story: StoryRecord): NarrativeSource {
  return {
    kind: "story",
    id: story.id,
    date: "",
    title: story.title,
    detail: `${story.summary}. ${story.detail}`,
    sourceText: story.sourceText,
    significance: story.significance
  };
}

function briefingToNarrativeSource(briefing: BriefingRecord): NarrativeSource {
  return {
    kind: "briefing",
    id: briefing.id,
    date: briefing.briefingDate,
    title: briefing.title,
    detail: briefing.body,
    sourceText: briefing.sourceRefs.join(" / "),
    significance: "high"
  };
}

function loadRecentNarratives(db: DatabaseSync): NarrativeSource[] {
  const stories = getStories(db)
    .filter((story) => story.reviewState === "approved")
    .map(storyToNarrativeSource);
  const briefings = getBriefings(db)
    .filter((briefing) => briefing.reviewState === "approved" && briefing.publishState === "published")
    .slice(0, 8)
    .map(briefingToNarrativeSource);

  return [...stories, ...briefings];
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
    const hasStrikeFigure =
      /[0-9][0-9,]{2,}\+?\s+(?:strikes|sorties)/i.test(haystack) ||
      /[0-9][0-9,]{2,}\+?\s+(?:total\s+)?targets\s+(?:struck|hit)/i.test(haystack);
    const hasAggregateQualifier =
      /(?:total|cumulative|combined|campaign(?:\s+total)?|air campaign|all theaters|strike tally|sortie tally|since\s+[a-z]+\s+\d{1,2})/i.test(
        haystack
      );
    const hasStrikeContext =
      /(?:total|cumulative|combined|campaign(?:\s+total)?|all theaters).{0,40}(?:strikes|sorties|targets struck|targets hit)/i.test(
        haystack
      ) ||
      /(?:strikes|sorties|targets struck|targets hit).{0,40}(?:total|cumulative|combined|campaign(?:\s+total)?|all theaters)/i.test(
        haystack
      ) ||
      (hasStrikeFigure && hasAggregateQualifier);
    const hasTheaterActor =
      hasAnyEntityTag(entityTags, ["iran", "israel", "lebanon", "hezbollah", "united-states"]) ||
      /(?:iran|israel|lebanon|hezbollah|united states|u\.s\.)/i.test(haystack);
    if (!hasStrikeFigure && !hasStrikeContext) {
      return 0;
    }

    return (
      (hasStrikeFigure ? 8 : 0) +
      (hasStrikeContext ? 5 : 0) +
      (hasTheaterActor ? 4 : 0) +
      Math.min(event.corroboration, 3)
    );
  }

  if (key === "hormuz_daily_cap") {
    const hasHormuz = hasEntityTag(entityTags, "strait-of-hormuz") || /(hormuz|strait of hormuz)/i.test(haystack);
    const hasShippingContext =
      /(shipping corridor|tanker|throughput|transit|blockade|reopen|re-open|reclosed|re-closed|closed|opened|seafarers?|ships?|vessels?\s+(?:per day|a day|daily)|ships?\s+(?:per day|a day|daily))/i.test(
        haystack
      );
    const hasNumericCap =
      /(?:<=|up to|max(?:imum)?|cap(?:ped)?(?: at)?|only)\s*([0-9]{1,3})\s*(?:\/day|per day|ships\/day|vessels\/day)/i.test(
        haystack
      ) ||
      /([0-9]{1,3})\s+(?:ships|vessels)\s+(?:yesterday|a day|per day|daily|passed)/i.test(haystack);
    const hasWeeklyTransitSignal = /([0-9]{1,3})\s+(?:weekly\s+)?(?:vessel\s+)?transits/i.test(haystack);
    const hasConstraintContext =
      /(?:blockade|cannot be opened|shipping shockwaves|stranded|restricted|seized ships?|closed to traffic|corridor|below normal)/i.test(
        haystack
      );

    if (!hasHormuz || (!hasShippingContext && !hasNumericCap && !hasWeeklyTransitSignal && !hasConstraintContext)) {
      return 0;
    }

    return (
      (hasEntityTag(entityTags, "strait-of-hormuz") ? 8 : 0) +
      (/(hormuz|strait of hormuz)/i.test(haystack) ? 6 : 0) +
      (hasShippingContext ? 4 : 0) +
      (hasNumericCap ? 5 : 0) +
      (hasWeeklyTransitSignal ? 6 : 0) +
      (hasConstraintContext ? 3 : 0) +
      (event.category === "economic" ? 2 : 0) +
      Math.min(event.corroboration, 3)
    );
  }

  if (key === "iran_casualties_estimate") {
    const hasIranLocationContext =
      hasEntityTag(entityTags, "iran") ||
      /(?:in iran|across iran|iranian (?:city|cities|town|towns|school|sites|ports?|territory)|minab)/i.test(haystack);
    const hasCasualtyContext = /(?:casualt|killed|dead|deaths|fatalit)/i.test(haystack);
    const hasIranVictimContext =
      /(?:iran(?:ian)?\s+(?:casualties|civilians|children|victims|deaths|killed|dead|toll)|casualties in iran|deaths in iran|killed in iran|dead in iran|victims in iran)/i.test(
        haystack
      );
    const hasCasualtyFigure =
      /([0-9][0-9,]{3,})\+?\s+(?:iran(?:ian)?\s+)?(?:casualties|killed|dead|deaths)/i.test(haystack);
    const hasCombinedCasualtyFigure =
      /([0-9][0-9,]{2,})\+?\s+(?:people\s+)?killed(?:\s+and|\s*,|\s*;)?\s+([0-9][0-9,]{3,})\+?\s+injured(?:\s+in\s+iran|\s+since|\.)/i.test(
        haystack
      ) ||
      /([0-9][0-9,]{3,})\+?\s+injured(?:\s+and|\s*,|\s*;)?\s+([0-9][0-9,]{2,})\+?\s+(?:people\s+)?killed(?:\s+in\s+iran|\s+since|\.)/i.test(
        haystack
      );
    const hasImpactContext =
      /(?:bombed in iran|devastated|missing child|school bombed|sites devastated|civilian toll|war crimes)/i.test(haystack);

    if (!hasIranLocationContext || (!hasIranVictimContext && !hasCasualtyFigure && !hasCombinedCasualtyFigure && !(hasCasualtyContext && hasImpactContext))) {
      return 0;
    }

    return (
      (hasEntityTag(entityTags, "iran") ? 6 : 0) +
      (hasIranVictimContext ? 5 : 0) +
      (hasCasualtyContext ? 2 : 0) +
      (hasCasualtyFigure ? 7 : 0) +
      (hasCombinedCasualtyFigure ? 8 : 0) +
      (hasImpactContext ? 3 : 0) +
      (event.category === "iran_strike" ? 3 : event.category === "intel" ? 1 : 0) +
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

function deriveDailyThroughputFromWeeklyTransits(weeklyTransits: number): { display: number; exact: number } {
  const exact = weeklyTransits / 7;
  return {
    display: Math.max(1, Math.round(exact)),
    exact: Number(exact.toFixed(1))
  };
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

function hasOfficialStrikeSource(text: string): boolean {
  return /\b(?:centcom|reuters|admiral cooper|pentagon|u\.s\. military|officials say)\b/i.test(text);
}

function strikeValueText(value: number, haystack: string): string {
  if (/\b(?:over|more than|at least)\b/i.test(haystack) || /\+\s+(?:strikes|sorties|targets struck|targets hit)/i.test(haystack)) {
    return `${value.toLocaleString("en-US")}+ campaign strikes`;
  }

  return `${value.toLocaleString("en-US")} campaign strikes`;
}

function strikeSourceLabel(sourceText: string, haystack: string): string {
  if (/admiral cooper/i.test(haystack)) {
    return "CENTCOM Admiral Cooper (Apr 9) / operator review";
  }
  if (/centcom/i.test(sourceText) || /\bcentcom\b/i.test(haystack)) {
    return "CENTCOM / operator review";
  }
  if (/reuters/i.test(sourceText) || /\breuters\b/i.test(haystack)) {
    return "Reuters / operator review";
  }

  return `${sourceText} / operator review`;
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
    if (match) {
      const value = Number(match[1]);
      return {
        value,
        valueText: `<=${value}/day`,
        sourceText: `${event.sourceText} / operator synthesis`,
        confidence: event.corroboration >= 2 ? "reported" : "claimed",
        note: `Candidate extracted from ${event.title}.`
      };
    }

    const weeklyTransitMatch = haystack.match(/([0-9]{1,3})\s+(?:weekly\s+)?(?:vessel\s+)?transits/i);
    if (!weeklyTransitMatch || event.corroboration < 2) {
      return null;
    }

    const weeklyTransits = Number(weeklyTransitMatch[1]);
    const derived = deriveDailyThroughputFromWeeklyTransits(weeklyTransits);
    return {
      value: derived.display,
      valueText: `~${derived.display}/day observed`,
      sourceText: `${event.sourceText} / operator synthesis`,
      confidence: "reported",
      note: `Derived from ${weeklyTransits} reported weekly Hormuz transits (~${derived.exact}/day observed average) in ${event.title}. This reflects observed throughput, not a formal declared corridor cap.`
    };
  }

  if (key === "iran_casualties_estimate") {
    const combinedCasualtyMatch =
      haystack.match(
        /([0-9][0-9,]{2,})\+?\s+(?:people\s+)?killed(?:\s+and|\s*,|\s*;)?\s+([0-9][0-9,]{3,})\+?\s+injured(?:\s+in\s+iran|\s+since|\.)/i
      ) ??
      haystack.match(
        /([0-9][0-9,]{3,})\+?\s+injured(?:\s+and|\s*,|\s*;)?\s+([0-9][0-9,]{2,})\+?\s+(?:people\s+)?killed(?:\s+in\s+iran|\s+since|\.)/i
      );
    if (combinedCasualtyMatch) {
      const first = Number(combinedCasualtyMatch[1].replace(/,/g, ""));
      const second = Number(combinedCasualtyMatch[2].replace(/,/g, ""));
      const [killed, injured] =
        haystack.match(/killed.{0,80}injured/i) ? [first, second] : [second, first];
      const total = killed + injured;
      return {
        value: total,
        valueText: `${total.toLocaleString("en-US")} Iran total casualties`,
        sourceText: `${event.sourceText} / operator synthesis`,
        confidence: event.corroboration >= 2 ? "reported" : "claimed",
        note: `Derived from ${killed.toLocaleString("en-US")} killed and ${injured.toLocaleString("en-US")} injured reported in ${event.title}.`
      };
    }

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

function extractNarrativeCandidate(
  key: TopLineMetricKey,
  narrative: NarrativeSource
): OperatorMetricPublishInput | null {
  const haystack = `${narrative.title} ${narrative.detail}`;

  if (key !== "total_strikes") {
    return null;
  }

  if (!hasOfficialStrikeSource(`${narrative.sourceText} ${haystack}`)) {
    return null;
  }

  const match =
    haystack.match(/(?:over|more than|at least|about|approximately)?\s*([0-9][0-9,]{2,})\+?\s+(?:strikes|sorties)/i) ??
    haystack.match(/([0-9][0-9,]{2,})\+?\s+(?:total\s+)?targets\s+(?:struck|hit)/i);
  if (!match) {
    return null;
  }

  const value = Number(match[1].replace(/,/g, ""));
  const sourceLabel = strikeSourceLabel(narrative.sourceText, haystack);
  return {
    value,
    valueText: strikeValueText(value, match[0]),
    sourceText: sourceLabel,
    confidence: "reported",
    note: `Candidate derived from approved canonical ${narrative.kind} "${narrative.title}".`
  };
}

function selectBestCandidate(
  metricKey: TopLineMetricKey,
  events: EventRecord[],
  narratives: NarrativeSource[]
): CandidateMatch | null {
  const eventCandidates = events
    .map((event) => ({
      candidate: extractCandidate(metricKey, event),
      originKind: "event" as const,
      originTitle: event.title
    }))
    .filter((entry) => entry.candidate !== null) as CandidateMatch[];
  const narrativeCandidates = narratives
    .map((narrative) => ({
      candidate: extractNarrativeCandidate(metricKey, narrative),
      originKind: narrative.kind,
      originTitle: narrative.title
    }))
    .filter((entry) => entry.candidate !== null) as CandidateMatch[];

  const allCandidates = [...eventCandidates, ...narrativeCandidates];
  if (!allCandidates.length) {
    return null;
  }

  return allCandidates.sort((left, right) => {
    const leftValue = left.candidate.value ?? -1;
    const rightValue = right.candidate.value ?? -1;
    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }
    const leftEvent = left.originKind === "event" ? 1 : 0;
    const rightEvent = right.originKind === "event" ? 1 : 0;
    return rightEvent - leftEvent;
  })[0];
}

function buildSuggestion(
  metric: OperatorTopLineMetric,
  recentEvents: EventRecord[],
  entities: EntityRecord[],
  narratives: NarrativeSource[]
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
  const candidateMatch = selectBestCandidate(metric.key, relevantEvents, narratives);
  const candidate = candidateMatch?.candidate ?? null;

  if (current?.freshness === "operator_hold") {
    if (candidate) {
      return {
        key: metric.key,
        status: "candidate",
        summary:
          candidateMatch?.originKind && candidateMatch.originKind !== "event"
            ? `${definition.label} is currently on an operator-reviewed hold, but approved aggregate narrative evidence now supports a candidate refresh. Review the extracted value before publishing.`
            : `${definition.label} is currently on an operator-reviewed hold, but recent evidence now supports a candidate refresh. Review the extracted value before publishing.`,
        candidate,
        evidence
      };
    }

    return {
      key: metric.key,
      status: "reviewed_hold",
      summary: evidence.length
        ? `${definition.label} remains on an operator-reviewed hold. Recent evidence is contextually relevant, but it still does not support a defensible public number.`
        : `${definition.label} is on an operator-reviewed hold because current evidence is not yet defensible enough for public publication.`,
      candidate: null,
      evidence
    };
  }

  if (candidate) {
    return {
      key: metric.key,
      status: "candidate",
      summary:
        candidateMatch?.originKind && candidateMatch.originKind !== "event"
          ? `Approved aggregate narrative evidence contains a candidate ${definition.label.toLowerCase()} refresh. Review the extracted value before publishing.`
          : `Recent event evidence contains a candidate ${definition.label.toLowerCase()} refresh. Review the extracted value before publishing.`,
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
  const narratives = loadRecentNarratives(db);
  return metrics.map((metric) => buildSuggestion(metric, recentEvents, entities, narratives));
}
