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

type ClaimTemplate = {
  title: string;
  proposedStatus: string;
  statement: string;
};

type RankedSeed = {
  event: EventRecord;
  entityKeys: string[];
  eventRank: number;
  topicKey: string;
  topicKeywords: string[];
};

type StorySeed = RankedSeed & {
  key: string;
  matchedStory: StoryRecord | null;
  section: string;
};

type ClaimSeed = RankedSeed & {
  key: string;
  matchedClaim: ClaimRecord | null;
  template: ClaimTemplate;
};

type StoryCluster = {
  key: string;
  matchedStory: StoryRecord | null;
  section: string;
  seeds: StorySeed[];
  entityKeys: Set<string>;
};

type ClaimCluster = {
  key: string;
  matchedClaim: ClaimRecord | null;
  seeds: ClaimSeed[];
  entityKeys: Set<string>;
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

function pluralize(label: string, count: number): string {
  return count === 1 ? label : `${label}s`;
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

function significanceRank(significance: EventRecord["significance"]): number {
  if (significance === "critical") {
    return 0;
  }

  if (significance === "high") {
    return 1;
  }

  if (significance === "medium") {
    return 2;
  }

  return 3;
}

function strongestSignificance(events: RankedSeed[]): EventRecord["significance"] {
  return events
    .map((item) => item.event.significance)
    .sort((left, right) => significanceRank(left) - significanceRank(right))[0] ?? "watch";
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

function buildClusterKeywordSet(values: Array<string | null | undefined>): string[] {
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
    "with",
    "accord",
    "advisers",
    "air",
    "aircraft",
    "armed",
    "army",
    "commander",
    "commanders",
    "conflict",
    "crisis",
    "defense",
    "diplomatic",
    "downed",
    "drone",
    "drones",
    "fired",
    "force",
    "forces",
    "hezbollah",
    "hormuz",
    "iran",
    "iranian",
    "israel",
    "israeli",
    "killed",
    "lebanon",
    "lebanese",
    "military",
    "missile",
    "missiles",
    "pakistan",
    "shipping",
    "shipped",
    "ships",
    "strait",
    "strike",
    "strikes",
    "threat",
    "united",
    "states",
    "vessel",
    "vessels",
    "war"
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

function topicSignature(...values: Array<string | null | undefined>): string {
  return buildClusterKeywordSet(values).slice(0, 2).join("-") || "general";
}

function topicKeywordsForEvent(event: EventRecord): string[] {
  return buildKeywordSet([event.title, event.detail, event.sourceText]).slice(0, 8);
}

function topicKeyForEvent(event: EventRecord, entityKeys: string[]): string {
  const keywords = buildClusterKeywordSet([event.title, event.detail, event.sourceText]).slice(0, 2);
  const entityTokens = entityKeys
    .map((value) => value.replace(/^entity:/, ""))
    .filter(Boolean)
    .slice(0, 2);

  return uniqueStrings([...keywords, ...entityTokens, event.category]).slice(0, 2).join("-") || "general";
}

function daysBetween(left: string, right: string): number {
  return Math.abs(Date.parse(`${left}T00:00:00Z`) - Date.parse(`${right}T00:00:00Z`)) / 86_400_000;
}

function splitSourceNames(sourceText: string): string[] {
  return sourceText
    .split("/")
    .map((value) => value.trim())
    .filter(Boolean);
}

function atomicSourceNames(events: RankedSeed[]): string[] {
  return uniqueStrings(events.flatMap((item) => splitSourceNames(item.event.sourceText)));
}

function sourceTextForCluster(events: RankedSeed[]): string {
  return atomicSourceNames(events).slice(0, 4).join(" / ");
}

function sourceCountForCluster(events: RankedSeed[]): number {
  return atomicSourceNames(events).length;
}

function eventEntityKeys(event: EventRecord, entities: EntityRecord[]): string[] {
  return uniqueStrings([
    ...event.tags.filter((tag) => tag.startsWith("entity:")),
    ...entityTagsForText(entities, event.title, event.detail, event.sourceText)
  ]).slice(0, 6);
}

function sourceReliability(event: EventRecord, sourceMap: Map<string, SourceRecord>): number {
  return (
    splitSourceNames(event.sourceText)
      .map((value) => sourceMap.get(value)?.reliabilityScore ?? 0)
      .sort((left, right) => right - left)[0] ?? 0
  );
}

function eventRank(
  event: EventRecord,
  entityKeys: string[],
  sourceMap: Map<string, SourceRecord>
): number {
  return (
    significanceWeight(event.significance) +
    event.corroboration * 2 +
    Math.round(sourceReliability(event, sourceMap) * 4) +
    entityKeys.length
  );
}

function sortSeedsBySignal(left: RankedSeed, right: RankedSeed): number {
  return (
    right.eventRank - left.eventRank ||
    right.event.date.localeCompare(left.event.date) ||
    right.event.corroboration - left.event.corroboration ||
    right.event.createdAt.localeCompare(left.event.createdAt)
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

function clusterConfidence(events: RankedSeed[]): Confidence {
  const sourceCount = sourceCountForCluster(events);
  if (events.length >= 3 || sourceCount >= 3) {
    return "reported";
  }

  return suggestionConfidence(events[0]?.event ?? {
    corroboration: 1,
    confidence: "claimed"
  } as EventRecord);
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

function evidenceFromSeeds(seeds: RankedSeed[]) {
  return [...seeds]
    .sort(sortSeedsBySignal)
    .slice(0, 3)
    .map((seed) => ({
      eventId: seed.event.id,
      title: seed.event.title,
      date: seed.event.date,
      sourceText: seed.event.sourceText,
      significance: seed.event.significance,
      excerpt: `${seed.event.title}. ${seed.event.detail}`.replace(/\s+/g, " ").slice(0, 220)
    }));
}

function detailFromSeeds(seeds: RankedSeed[]): string {
  return [...seeds]
    .sort(sortSeedsBySignal)
    .slice(0, 3)
    .map((seed) => `${seed.event.date}: ${seed.event.title}. ${seed.event.detail}`)
    .join(" ")
    .slice(0, 620);
}

function pruneStorySeeds(cluster: StoryCluster): StorySeed[] {
  const seeds = [...cluster.seeds].sort(sortSeedsBySignal);
  const lead = seeds[0];
  const maxDays =
    cluster.matchedStory
      ? cluster.section === "front"
        ? 10
        : 14
      : cluster.section === "front"
        ? 7
        : 12;

  return seeds.filter((seed) => daysBetween(lead.event.date, seed.event.date) <= maxDays);
}

function pruneClaimSeeds(cluster: ClaimCluster): ClaimSeed[] {
  const seeds = [...cluster.seeds].sort(
    (left, right) =>
      (right.eventRank + claimStatusRank(right.template.proposedStatus)) -
      (left.eventRank + claimStatusRank(left.template.proposedStatus)) ||
      sortSeedsBySignal(left, right)
  );
  const lead = seeds[0];
  const laneTitle = cluster.matchedClaim?.title ?? lead.template.title;
  const maxDays =
    laneTitle === "Threat Level"
      ? 5
      : laneTitle === "Ceasefire / Deadline Status" || laneTitle === "Negotiation Track"
        ? 10
        : 14;

  return seeds.filter((seed) => daysBetween(lead.event.date, seed.event.date) <= maxDays);
}

function sortClaimSeedsByPriority(left: ClaimSeed, right: ClaimSeed): number {
  return (
    (right.eventRank + claimStatusRank(right.template.proposedStatus)) -
      (left.eventRank + claimStatusRank(left.template.proposedStatus)) ||
    sortSeedsBySignal(left, right)
  );
}

function claimSeedCompatibility(cluster: ClaimCluster, seed: ClaimSeed): boolean {
  const lead = [...cluster.seeds].sort(sortClaimSeedsByPriority)[0];
  if (!lead) {
    return true;
  }

  const keywordOverlap = keywordOverlapScore(lead.topicKeywords, seed.topicKeywords);
  const entityOverlap = seed.entityKeys.filter((key) => cluster.entityKeys.has(key)).length;
  const sameCategory = lead.event.category === seed.event.category;
  const laneTitle = cluster.matchedClaim?.title ?? lead.template.title;

  if (laneTitle === "Threat Level") {
    return keywordOverlap >= 2 || (keywordOverlap >= 1 && entityOverlap >= 1) || (entityOverlap >= 2 && sameCategory);
  }

  if (laneTitle === "Ceasefire / Deadline Status" || laneTitle === "Negotiation Track") {
    return keywordOverlap >= 1 || entityOverlap >= 1 || sameCategory;
  }

  if (laneTitle === "Hormuz Shipping Constraint") {
    return keywordOverlap >= 1 || entityOverlap >= 1;
  }

  return keywordOverlap >= 1 || (entityOverlap >= 1 && sameCategory);
}

function storyClusterKey(event: EventRecord, entityKeys: string[]): string {
  const section = sectionForEvent(event);
  const entityKey = entityKeys[0]?.replace(/^entity:/, "") ?? event.category;
  const topicKey = topicKeyForEvent(event, entityKeys);
  return `${section}:${entityKey}:${topicKey}`;
}

function buildStorySeed(
  event: EventRecord,
  entities: EntityRecord[],
  stories: StoryRecord[],
  sourceMap: Map<string, SourceRecord>
): StorySeed | null {
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
  const topicKey = topicKeyForEvent(event, entityKeys);
  const topicKeywords = topicKeywordsForEvent(event);

  return {
    key: hasStoryMatch ? `${matchedStory.story.id}:${topicKey}` : storyClusterKey(event, entityKeys),
    matchedStory: hasStoryMatch ? matchedStory.story : null,
    section: hasStoryMatch ? matchedStory.story.section : sectionForEvent(event),
    event,
    entityKeys,
    eventRank: eventRank(event, entityKeys, sourceMap),
    topicKey,
    topicKeywords
  };
}

function extractClaimTemplate(
  event: EventRecord,
  entityKeys: string[]
): ClaimTemplate | null {
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

function claimStatusRank(status: string): number {
  const normalized = status.toLowerCase();
  if (normalized.includes("severe") || normalized.includes("critical")) {
    return 40;
  }
  if (normalized.includes("under pressure")) {
    return 30;
  }
  if (normalized.includes("constrained")) {
    return 20;
  }
  if (normalized.includes("active")) {
    return 10;
  }

  return 0;
}

function buildClaimSeed(
  event: EventRecord,
  entities: EntityRecord[],
  claims: ClaimRecord[],
  sourceMap: Map<string, SourceRecord>
): ClaimSeed | null {
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
  const topicKey = topicKeyForEvent(event, entityKeys);
  const topicKeywords = topicKeywordsForEvent(event);

  return {
    key: hasClaimMatch ? matchedClaim.claim.id : template.title,
    matchedClaim: hasClaimMatch ? matchedClaim.claim : null,
    template,
    event,
    entityKeys,
    eventRank: eventRank(event, entityKeys, sourceMap),
    topicKey,
    topicKeywords
  };
}

function pushStorySeed(clusters: Map<string, StoryCluster>, seed: StorySeed) {
  const existing = clusters.get(seed.key);
  if (!existing) {
    clusters.set(seed.key, {
      key: seed.key,
      matchedStory: seed.matchedStory,
      section: seed.section,
      seeds: [seed],
      entityKeys: new Set(seed.entityKeys)
    });
    return;
  }

  if (existing.seeds.some((item) => item.event.id === seed.event.id)) {
    return;
  }

  existing.seeds.push(seed);
  for (const key of seed.entityKeys) {
    existing.entityKeys.add(key);
  }
}

function pushClaimSeed(clusters: Map<string, ClaimCluster>, seed: ClaimSeed) {
  const candidateKeyPrefix = `${seed.key}::`;
  const existingClusters = Array.from(clusters.values()).filter(
    (cluster) => cluster.key === seed.key || cluster.key.startsWith(candidateKeyPrefix)
  );
  const compatibleCluster = existingClusters.find((cluster) => claimSeedCompatibility(cluster, seed));

  if (compatibleCluster) {
    if (compatibleCluster.seeds.some((item) => item.event.id === seed.event.id)) {
      return;
    }

    compatibleCluster.seeds.push(seed);
    for (const key of seed.entityKeys) {
      compatibleCluster.entityKeys.add(key);
    }
    return;
  }

  const clusterKey = existingClusters.length === 0 ? seed.key : `${seed.key}::${seed.topicKey}`;

  clusters.set(clusterKey, {
    key: clusterKey,
    matchedClaim: seed.matchedClaim,
    seeds: [seed],
    entityKeys: new Set(seed.entityKeys)
  });
}

function buildStorySuggestion(cluster: StoryCluster): { rank: number; suggestion: OperatorStorySuggestion } {
  const seeds = pruneStorySeeds(cluster);
  const lead = seeds[0];
  const matchedStory = cluster.matchedStory;
  const eventCount = seeds.length;
  const sourceCount = sourceCountForCluster(seeds);
  const significance = strongestSignificance(seeds);
  const sourceText = sourceTextForCluster(seeds);
  const detail = detailFromSeeds(seeds);
  const evidence = evidenceFromSeeds(seeds);
  const rank = seeds.reduce((total, seed) => total + seed.eventRank, 0) + sourceCount * 2 + (matchedStory ? 4 : 0);
  const summary = matchedStory
    ? `${eventCount} recent ${pluralize("event", eventCount)} from ${sourceCount} ${pluralize("source", sourceCount)} reinforce ${matchedStory.title}. Latest: ${lead.event.detail}`.slice(0, 240)
    : `${eventCount} recent ${pluralize("event", eventCount)} from ${sourceCount} ${pluralize("source", sourceCount)} suggest a new ${cluster.section} story lane. Latest: ${lead.event.detail}`.slice(0, 240);
  const rationale = matchedStory
    ? `Clustered evidence across ${eventCount} ${pluralize("event", eventCount)} and ${sourceCount} ${pluralize("source", sourceCount)} hits the same actor/topic lane, so this should update the existing ${cluster.section} story rather than create drift.`
    : `Clustered evidence across ${eventCount} ${pluralize("event", eventCount)} and ${sourceCount} ${pluralize("source", sourceCount)} with canonical actor overlap suggests a durable new ${cluster.section} story, not a one-off event card.`;

  return {
    rank,
    suggestion: {
      id: toId("story_suggestion", cluster.key),
      status: matchedStory ? "update_story" : "new_story",
      title: matchedStory?.title ?? lead.event.title,
      suggestedSection: matchedStory?.section ?? cluster.section,
      significance,
      eventCount,
      sourceCount,
      summary,
      detail,
      sourceText,
      rationale,
      matchedStoryId: matchedStory?.id ?? null,
      matchedStoryTitle: matchedStory?.title ?? null,
      entityKeys: Array.from(cluster.entityKeys).slice(0, 6),
      queueId: null,
      evidence
    }
  };
}

function buildClaimSuggestion(cluster: ClaimCluster): { rank: number; suggestion: OperatorClaimSuggestion } {
  const seeds = pruneClaimSeeds(cluster);
  const lead = seeds[0];
  const matchedClaim = cluster.matchedClaim;
  const eventCount = seeds.length;
  const sourceCount = sourceCountForCluster(seeds);
  const significance = strongestSignificance(seeds);
  const confidence = clusterConfidence(seeds);
  const rank = seeds.reduce((total, seed) => total + seed.eventRank, 0) + sourceCount * 2 + (matchedClaim ? 4 : 0);
  const rationale = matchedClaim
    ? `Clustered evidence across ${eventCount} ${pluralize("event", eventCount)} and ${sourceCount} ${pluralize("source", sourceCount)} fits the existing canonical claim lane and should update operator review instead of creating drift.`
    : `Clustered evidence across ${eventCount} ${pluralize("event", eventCount)} and ${sourceCount} ${pluralize("source", sourceCount)} exposes a stable monitored assertion that should become a canonical claim.`;

  return {
    rank,
    suggestion: {
      id: toId("claim_suggestion", cluster.key),
      status: matchedClaim ? "update_claim" : "new_claim",
      title: matchedClaim?.title ?? lead.template.title,
      proposedStatus: lead.template.proposedStatus,
      statement: lead.template.statement,
      significance,
      confidence,
      eventCount,
      sourceCount,
      rationale,
      matchedClaimId: matchedClaim?.id ?? null,
      matchedClaimTitle: matchedClaim?.title ?? null,
      entityKeys: Array.from(cluster.entityKeys).slice(0, 6),
      queueId: null,
      evidence: evidenceFromSeeds(seeds)
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

  const storyClusters = new Map<string, StoryCluster>();
  const claimClusters = new Map<string, ClaimCluster>();

  for (const event of recentEvents) {
    const storySeed = buildStorySeed(event, entities, stories, sourceMap);
    if (storySeed) {
      pushStorySeed(storyClusters, storySeed);
    }

    const claimSeed = buildClaimSeed(event, entities, claims, sourceMap);
    if (claimSeed) {
      pushClaimSeed(claimClusters, claimSeed);
    }
  }

  const storyList = Array.from(storyClusters.values())
    .map((cluster) => buildStorySuggestion(cluster))
    .sort((left, right) => right.rank - left.rank)
    .map((entry) => entry.suggestion)
    .slice(0, 4);
  const claimList = Array.from(claimClusters.values())
    .map((cluster) => buildClaimSuggestion(cluster))
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
      ? "Graph-aware synthesis proposes updating an existing canonical story from clustered recent evidence."
      : "Graph-aware synthesis proposes creating a new canonical story from clustered recent evidence.",
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
      ? "Graph-aware synthesis proposes updating an existing canonical claim from clustered recent evidence."
      : "Graph-aware synthesis proposes creating a new canonical claim from clustered recent evidence.",
    {
      ...suggestion,
      queueId: null
    }
  );

  return queueId;
}
