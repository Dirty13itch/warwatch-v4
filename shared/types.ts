export const confidenceLevels = [
  "confirmed",
  "reported",
  "claimed",
  "disputed",
  "unverified",
  "auto_extracted"
] as const;

export const significanceLevels = [
  "critical",
  "high",
  "medium",
  "watch"
] as const;

export const reviewStates = [
  "approved",
  "pending",
  "rejected",
  "auto_published"
] as const;

export const visibilities = ["primary", "secondary", "review_only"] as const;

export type Confidence = (typeof confidenceLevels)[number];
export type Significance = (typeof significanceLevels)[number];
export type ReviewState = (typeof reviewStates)[number];
export type Visibility = (typeof visibilities)[number];

export type SourceType =
  | "official_us"
  | "official_iran"
  | "regional"
  | "wire"
  | "independent"
  | "osint"
  | "state_media"
  | "analysis"
  | "dataset";

export interface SourceRecord {
  id: string;
  slug: string;
  name: string;
  type: SourceType;
  reliabilityScore: number;
  biasDirection: string;
  notes: string;
  reviewState: ReviewState;
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface EventRecord {
  id: string;
  date: string;
  time: string | null;
  title: string;
  detail: string;
  category: string;
  significance: Significance;
  confidence: Confidence;
  corroboration: number;
  sourceText: string;
  sourceRefs: string[];
  reviewState: ReviewState;
  visibility: Visibility;
  geo: GeoPoint | null;
  tags: string[];
  createdAt: string;
}

export interface MetricSnapshot {
  id: string;
  metricKey: string;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  timestamp: string;
  sourceText: string;
  confidence: Confidence;
  reviewState: ReviewState;
  freshness: string;
  meta: Record<string, unknown>;
}

export interface StoryRecord {
  id: string;
  slug: string;
  title: string;
  section: string;
  summary: string;
  detail: string;
  significance: Significance;
  sourceText: string;
  reviewState: ReviewState;
  meta: Record<string, unknown>;
}

export interface ClaimRecord {
  id: string;
  title: string;
  statement: string;
  status: string;
  significance: Significance;
  confidence: Confidence;
  evidenceRefs: string[];
  reviewState: ReviewState;
  lastReviewedAt: string | null;
}

export interface EntityRecord {
  id: string;
  slug: string;
  name: string;
  kind: string;
  summary: string;
}

export interface RelationshipRecord {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  confidence: Confidence;
  note: string;
}

export interface BriefingRecord {
  id: string;
  briefingDate: string;
  title: string;
  body: string;
  sourceRefs: string[];
  reviewState: ReviewState;
  publishState: "published" | "draft";
  createdAt: string;
}

export interface ReviewQueueItem {
  id: string;
  itemType: string;
  itemId: string;
  title: string;
  severity: "critical" | "high" | "medium";
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface IngestionRun {
  id: string;
  feedName: string;
  runType: string;
  status: "success" | "partial" | "error";
  startedAt: string;
  finishedAt: string | null;
  summary: string;
  insertedCount: number;
  queuedCount: number;
  errorText: string | null;
}

export interface MapFeature {
  id: string;
  layerKey: string;
  title: string;
  kind: string;
  lat: number;
  lon: number;
  severity: string;
  status: string;
  sourceText: string;
  reviewState: ReviewState;
  meta: Record<string, unknown>;
}

export interface OverviewKpi {
  key: string;
  label: string;
  value: string;
  supportingText: string;
  freshness: string;
}

export interface FrontSummary {
  id: string;
  title: string;
  status: string;
  summary: string;
  significance: Significance;
  icon: string | null;
}

export interface OverviewResponse {
  generatedAt: string;
  currentDay: number;
  stale: boolean;
  legacyAsOf: string | null;
  headline: {
    level: string;
    label: string;
    description: string;
  };
  kpis: OverviewKpi[];
  fronts: FrontSummary[];
  queue: {
    pending: number;
    critical: number;
    lastIngestionStatus: string;
  };
}

