import crypto from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { severityFromSignificance } from "../shared/review.js";
import { entityTagsForText } from "../shared/entity-matching.js";
import type {
  ClaimRecord,
  Confidence,
  EntityRecord,
  EventRecord,
  OperatorClaimSuggestion,
  OperatorStorySuggestion,
  OperatorSynthesisSnapshot,
  SourceRecord,
  StoryRecord
} from "../shared/types.js";
import { getClaims, getEntities, getEvents, getSources, getStories } from "./store.js";

type SuggestionQueueMaps = {
  story: Map<string, string>;
  claim: Map<string, string>;
};

function toId(prefix: string, value: string): string {
  return `${prefix}_${crypto.createHash("sha1").update(value).digest("hex").slice(0, 12)}`;
}

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function significanceWeight(significance: EventRecord["significance"]): number {
  if (significance === "critical") {
    return 9;
  }

  if (significance === "high") {
    return 6;
  }

  if (significance === "medium") {
    return 3;
  }

  return 1;
}

function buildKeywordSet(values: Array<string | null | undefined>): string[] {
  const stopWords = new Set([
    "about",
    "after",
    "against",
    "again",
    "amid",
    "analysts",
    "around",
    "before",
    "between",
    "campaign",
    "combined",
    "control",
    "described",
    "describes",
    "event",
    "fresh",
    "from",
    "holding",
    "latest",
    "multiple",
    "operators",
    "public",
    "recent",
    "report",
    "reported",
    "shell",
    "should",
    "still",
    "synthesis",
    "their",
    "today",
    "under",
    "update",
    "while",
    "with"
  ]);

  return Array.from(
    new Set(
      values
        .flatMap((value) =>
          String(value ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .split(" ")
        )
        .map((value) => value.trim())
        .filter((value) => value.length >= 4 && !stopWords.has(value))
    )
  );
}

function keywordOverlapScore(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return left.reduce((score, keyword) => score + (rightSet.has(keyword) ? 1 : 0), 0);
}

function eventEntityKeys(event: EventRecord, entities: EntityRecord[]): string[] {
  return uniqueStrings([
    ...event.tags.filter((tag) => tag.startsWith("entity:")),
    ...entityTagsForText(entities, event.title, event.detail, event.sourceText)
  ]).slice(0, 4);
}

function sourceReliability(event: EventRecord, sourceMap: Map<string, SourceRecord>): number {
  return (
    event.sourceText
      .split("/")
      .map((value) => sourceMap.get(value.trim())?.reliabilityScore ?? 0)
      .sort((left, right) => right - left)[0] ?? 0
  );
}

function suggestionConfidence(event: EventRecord): Confidence {
  if (event.corroboration >= 3) {
    return "reported";
  }

  if (event.confidence === "unverified" || event.confidence === "auto_extracted") {
    return "claimed";
  }

  return event.confidence;
}

function sectionForEvent(event: EventRecord): string {
  if (event.category === "diplomatic" || event.category.endsWith("_strike")) {
    return "front";
  }

  return "indicator";
}

function storyMatchScore(
  story: StoryRecord,
  event: EventRecord,
  entityKeys: string[],
  entities: EntityRecord[]
): number {
  if (story.section !== sectionForEvent(event)) {
    return 0;
  }

  const storyEntities = entityTagsForText(entities, story.title, story.summary, story.detail, story.sourceText);
  const entityOverlap = entityKeys.filter((key) => storyEntities.includes(key)).length;
  const keywordOverlap = keywordOverlapScore(
    buildKeywordSet([story.title, story.summary, story.detail]),
    buildKeywordSet([event.title, event.detail, event.sourceText])
  );

  if (keywordOverlap === 0) {
    return 0;
  }

  return entityOverlap * 5 + keywordOverlap * 2 + 2;
}

function claimMatchScore(
  claim: ClaimRecord,
  title: string,
  statement: string,
  entityKeys: string[],
  entities: EntityRecord[]
): number {
  const claimEntities = entityTagsForText(entities, claim.title, claim.statement, claim.status, claim.evidenceRefs.join(" "));
  const entityOverlap = entityKeys.filter((key) => claimEntities.includes(key)).length;
  const keywordOverlap = keywordOverlapScore(
    buildKeywordSet([claim.title, claim.statement, claim.status]),
    buildKeywordSet([title, statement])
  );
  const exactTitle = claim.title.toLowerCase() === title.toLowerCase();

  if (!exactTitle && keywordOverlap < 2) {
    return 0;
  }

  return entityOverlap * 5 + keywordOverlap * 2 + (exactTitle ? 6 : 0);
}

function evidenceForEvent(event: EventRecord) {
  return [
    {
      eventId: event.id,
      title: event.title,
      date: event.date,
      sourceText: event.sourceText,
      significance: event.significance,
      excerpt: `${event.title}. ${event.detail}`.replace(/\s+/g, " ").slice(0, 220)
    }
  ];
}

function buildStorySuggestion(
  event: EventRecord,
  entities: EntityRecord[],
  stories: StoryRecord[],
  sourceMap: Map<string, SourceRecord>
): { key: string; rank: number; suggestion: OperatorStorySuggestion } | null {
  if (event.reviewState === "rejected" || event.category === "seismic" || event.significance === "watch") {
    return null;
  }

  if (event.corroboration < 2 && event.significance !== "critical") {
    return null;
  }

  const entityKeys = eventEntityKeys(event, entities);
  const matchedStory = stories
    .map((story) => ({
      story,
      score: storyMatchScore(story, event, entityKeys, entities)
    }))
    .sort((left, right) => right.score - left.score)[0];
  const hasStoryMatch = (matchedStory?.score ?? 0) >= 9;
  const title = hasStoryMatch ? matchedStory.story.title : event.title;
  const detail = event.detail.slice(0, 520);
  const summary = hasStoryMatch
    ? `Update candidate for ${matchedStory.story.title} from ${event.sourceText}. ${event.detail}`
    : `${event.detail} Source: ${event.sourceText}.`;
  const entityLabels = entityKeys.map((key) => key.replace("entity:", ""));
  const rationale = hasStoryMatch
    ? `Entity overlap and keyword match suggest this event should update the existing ${matchedStory.story.section} story rather than create another parallel narrative.`
    : `High-signal ${sectionForEvent(event)} evidence with ${event.corroboration} corroborating references and canonical actor matches suggests a new story lane is warranted.`;
  const rank =
    significanceWeight(event.significance) +
    event.corroboration * 2 +
    Math.round(sourceReliability(event, sourceMap) * 4) +
    (hasStoryMatch ? 2 : 0) +
    entityKeys.length;

  return {
    key: hasStoryMatch ? matchedStory.story.id : `${sectionForEvent(event)}:${entityLabels[0] ?? event.category}`,
    rank,
    suggestion: {
      id: `story-suggestion:${event.id}`,
      status: hasStoryMatch ? "update_story" : "new_story",
      title,
      suggestedSection: hasStoryMatch ? matchedStory.story.section : sectionForEvent(event),
      significance: event.significance,
      summary: summary.slice(0, 240),
      detail,
      sourceText: event.sourceText,
      rationale,
      matchedStoryId: hasStoryMatch ? matchedStory.story.id : null,
      matchedStoryTitle: hasStoryMatch ? matchedStory.story.title : null,
      entityKeys,
      queueId: null,
      evidence: evidenceForEvent(event)
    }
  };
}

function extractClaimTemplate(
  event: EventRecord,
  entityKeys: string[]
): {
  title: string;
  proposedStatus: string;
  statement: string;
} | null {
  const haystack = `${event.title} ${event.detail}`;

  if (event.category === "diplomatic" && /(ceasefire|truce|deadline|brokered|talks|negotiation)/i.test(haystack)) {
    if (/(collapse|walks out|breakdown|rejected|stalled)/i.test(haystack)) {
      return {
        title: /(ceasefire|truce|deadline)/i.test(haystack) ? "Ceasefire / Deadline Status" : "Negotiation Track",
        proposedStatus: "Under pressure",
        statement: "Recent diplomatic reporting indicates the ceasefire and negotiation track remain fragile and vulnerable to breakdown."
      };
    }

    return {
      title: /(ceasefire|truce|deadline)/i.test(haystack) ? "Ceasefire / Deadline Status" : "Negotiation Track",
      proposedStatus: "Active",
      statement: "Recent diplomatic reporting indicates active negotiation pressure, but the ceasefire track remains unresolved and review-gated."
    };
  }

  if (entityKeys.includes("entity:strait-of-hormuz") && /(shipping|throughput|corridor|transit|tanker|closure|halt|cap)/i.test(haystack)) {
    return {
      title: "Hormuz Shipping Constraint",
      proposedStatus: /(closure|halt|stop)/i.test(haystack) ? "Severe disruption" : "Constrained transit",
      statement: "Shipping through the Strait of Hormuz remains materially constrained and should stay on the public watchboard as an explicit monitored claim."
    };
  }

  if (event.category.endsWith("_strike") || /(missile|drone|strike|rocket|air raid)/i.test(haystack)) {
    return {
      title: "Threat Level",
      proposedStatus: event.significance === "critical" ? "CRITICAL" : "HIGH",
      statement: "Recent strike reporting supports maintaining a high-threat public posture until the operator lane reviews whether escalation meaningfully changed."
    };
  }

  return null;
}

function buildClaimSuggestion(
  event: EventRecord,
  entities: EntityRecord[],
  claims: ClaimRecord[],
  sourceMap: Map<string, SourceRecord>
): { key: string; rank: number; suggestion: OperatorClaimSuggestion } | null {
  if (event.reviewState === "rejected" || event.significance === "watch" || event.category === "seismic") {
    return null;
  }

  const entityKeys = eventEntityKeys(event, entities);
  const template = extractClaimTemplate(event, entityKeys);
  if (!template) {
    return null;
  }

  const matchedClaim = claims
    .map((claim) => ({
      claim,
      score: claimMatchScore(claim, template.title, template.statement, entityKeys, entities)
    }))
    .sort((left, right) => right.score - left.score)[0];
  const hasClaimMatch = (matchedClaim?.score ?? 0) >= 9;
  const rank =
    significanceWeight(event.significance) +
    event.corroboration * 2 +
    Math.round(sourceReliability(event, sourceMap) * 4) +
    (hasClaimMatch ? 2 : 0) +
    entityKeys.length;

  return {
    key: template.title,
    rank,
    suggestion: {
      id: `claim-suggestion:${event.id}`,
      status: hasClaimMatch ? "update_claim" : "new_claim",
      title: template.title,
      proposedStatus: template.proposedStatus,
      statement: template.statement,
      significance: event.significance,
      confidence: suggestionConfidence(event),
      rationale: hasClaimMatch
        ? "Recent evidence fits an existing canonical claim lane and should update operator review instead of creating drift."
        : "Recent evidence exposes a stable monitored assertion that is not yet represented as a canonical claim.",
      matchedClaimId: hasClaimMatch ? matchedClaim.claim.id : null,
      matchedClaimTitle: hasClaimMatch ? matchedClaim.claim.title : null,
      entityKeys,
      queueId: null,
      evidence: evidenceForEvent(event)
    }
  };
}

function loadPendingSuggestionQueues(db: DatabaseSync): SuggestionQueueMaps {
  const rows = db.prepare(`
    SELECT id, item_type, item_id
    FROM review_queue
    WHERE status = 'pending' AND item_type IN ('story_suggestion', 'claim_suggestion')
  `).all() as Array<{
    id: string;
    item_type: string;
    item_id: string;
  }>;

  const story = new Map<string, string>();
  const claim = new Map<string, string>();
  for (const row of rows) {
    if (row.item_type === "story_suggestion") {
      story.set(row.item_id, row.id);
    } else if (row.item_type === "claim_suggestion") {
      claim.set(row.item_id, row.id);
    }
  }

  return { story, claim };
}

function buildSynthesisSnapshot(
  db: DatabaseSync,
  options: { includeQueueState?: boolean } = {}
): OperatorSynthesisSnapshot {
  const entities = getEntities(db);
  const stories = getStories(db);
  const claims = getClaims(db);
  const sourceMap = new Map(getSources(db).map((source) => [source.name, source]));
  const recentEvents = getEvents(db, { includeHidden: true, limit: 140 });

  const storySuggestions = new Map<string, { rank: number; suggestion: OperatorStorySuggestion }>();
  const claimSuggestions = new Map<string, { rank: number; suggestion: OperatorClaimSuggestion }>();

  for (const event of recentEvents) {
    const storyCandidate = buildStorySuggestion(event, entities, stories, sourceMap);
    if (storyCandidate) {
      const existing = storySuggestions.get(storyCandidate.key);
      if (!existing || storyCandidate.rank > existing.rank) {
        storySuggestions.set(storyCandidate.key, {
          rank: storyCandidate.rank,
          suggestion: storyCandidate.suggestion
        });
      }
    }

    const claimCandidate = buildClaimSuggestion(event, entities, claims, sourceMap);
    if (claimCandidate) {
      const existing = claimSuggestions.get(claimCandidate.key);
      if (!existing || claimCandidate.rank > existing.rank) {
        claimSuggestions.set(claimCandidate.key, {
          rank: claimCandidate.rank,
          suggestion: claimCandidate.suggestion
        });
      }
    }
  }

  const storyList = Array.from(storySuggestions.values())
    .sort((left, right) => right.rank - left.rank)
    .map((entry) => entry.suggestion)
    .slice(0, 4);
  const claimList = Array.from(claimSuggestions.values())
    .sort((left, right) => right.rank - left.rank)
    .map((entry) => entry.suggestion)
    .slice(0, 4);

  if (options.includeQueueState === false) {
    return { stories: storyList, claims: claimList };
  }

  const queueMaps = loadPendingSuggestionQueues(db);
  return {
    stories: storyList.map((story) => ({
      ...story,
      queueId: queueMaps.story.get(story.id) ?? null
    })),
    claims: claimList.map((claim) => ({
      ...claim,
      queueId: queueMaps.claim.get(claim.id) ?? null
    }))
  };
}

function queueSuggestionRow(
  db: DatabaseSync,
  itemType: "story_suggestion" | "claim_suggestion",
  suggestionId: string,
  title: string,
  severity: "critical" | "high" | "medium",
  reason: string,
  suggestion: OperatorStorySuggestion | OperatorClaimSuggestion
): string {
  const queueId = toId("queue", `${itemType}:${suggestionId}`);
  const now = new Date().toISOString();
  const nextMetadata = {
    suggestion,
    queuedAt: now,
    queuedBy: "operator_synthesis"
  };
  const existing = db.prepare(`
    SELECT id
    FROM review_queue
    WHERE id = ?
  `).get(queueId) as { id?: string } | undefined;

  if (existing?.id) {
    db.prepare(`
      UPDATE review_queue
      SET title = ?, severity = ?, reason = ?, status = 'pending', updated_at = ?, metadata_json = ?
      WHERE id = ?
    `).run(title, severity, reason, now, json(nextMetadata), queueId);
    return queueId;
  }

  db.prepare(`
    INSERT INTO review_queue (
      id, item_type, item_id, title, severity, reason, status, created_at, updated_at, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(queueId, itemType, suggestionId, title, severity, reason, "pending", now, now, json(nextMetadata));

  return queueId;
}

export function getSynthesisSuggestions(db: DatabaseSync): OperatorSynthesisSnapshot {
  return buildSynthesisSnapshot(db);
}

export function queueStorySuggestion(db: DatabaseSync, suggestionId: string): string | null {
  const suggestion = buildSynthesisSnapshot(db, { includeQueueState: false }).stories.find((item) => item.id === suggestionId);
  if (!suggestion) {
    return null;
  }

  const queueId = queueSuggestionRow(
    db,
    "story_suggestion",
    suggestion.id,
    suggestion.title,
    severityFromSignificance(suggestion.significance),
    suggestion.status === "update_story"
      ? "Graph-aware synthesis proposes updating an existing canonical story from recent evidence."
      : "Graph-aware synthesis proposes creating a new canonical story from recent evidence.",
    {
      ...suggestion,
      queueId: null
    }
  );

  return queueId;
}

export function queueClaimSuggestion(db: DatabaseSync, suggestionId: string): string | null {
  const suggestion = buildSynthesisSnapshot(db, { includeQueueState: false }).claims.find((item) => item.id === suggestionId);
  if (!suggestion) {
    return null;
  }

  const queueId = queueSuggestionRow(
    db,
    "claim_suggestion",
    suggestion.id,
    suggestion.title,
    severityFromSignificance(suggestion.significance),
    suggestion.status === "update_claim"
      ? "Graph-aware synthesis proposes updating an existing canonical claim from recent evidence."
      : "Graph-aware synthesis proposes creating a new canonical claim from recent evidence.",
    {
      ...suggestion,
      queueId: null
    }
  );

  return queueId;
}
