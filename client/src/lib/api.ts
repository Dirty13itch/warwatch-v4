import type {
  BriefingRecord,
  EventRecord,
  IngestionRun,
  MapFeature,
  MetricSnapshot,
  OperatorMetricPublishInput,
  OperatorTopLineMetric,
  OverviewResponse,
  ReviewQueueItem,
  SourceRecord,
  StoryRecord
} from "@shared/types";

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export const api = {
  overview: () => requestJson<OverviewResponse>("/api/overview"),
  events: () => requestJson<EventRecord[]>("/api/events?limit=240"),
  stories: () => requestJson<StoryRecord[]>("/api/stories"),
  briefings: () => requestJson<BriefingRecord[]>("/api/briefings"),
  sources: () => requestJson<SourceRecord[]>("/api/sources"),
  mapLayers: () => requestJson<Record<string, MapFeature[]>>("/api/map/layers"),
  metricHistory: (key: string) =>
    requestJson<MetricSnapshot[]>(`/api/metrics/${encodeURIComponent(key)}/history`),
  reviewQueue: () => requestJson<ReviewQueueItem[]>("/api/operator/review-queue"),
  ingestionRuns: () => requestJson<IngestionRun[]>("/api/operator/ingestion-runs"),
  topLineMetrics: () => requestJson<OperatorTopLineMetric[]>("/api/operator/topline-metrics"),
  approveQueueItem: (id: string) =>
    requestJson<ReviewQueueItem>(`/api/operator/review-queue/${id}/approve`, {
      method: "POST"
    }),
  rejectQueueItem: (id: string) =>
    requestJson<ReviewQueueItem>(`/api/operator/review-queue/${id}/reject`, {
      method: "POST"
    }),
  runIngest: () =>
    requestJson<{ ok: boolean }>("/api/operator/ingest", {
      method: "POST"
    }),
  publishTopLineMetric: (key: string, payload: OperatorMetricPublishInput) =>
    requestJson<OperatorTopLineMetric>(`/api/operator/topline-metrics/${encodeURIComponent(key)}`, {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
