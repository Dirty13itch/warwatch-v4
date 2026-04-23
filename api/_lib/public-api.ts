import type { IncomingMessage, ServerResponse } from "node:http";
import publicSnapshot from "../../data/public-snapshot.json" with { type: "json" };
import { findSnapshotDossier, findSnapshotEvent } from "../../server/public-snapshot.js";
import type { PublicDataSnapshot } from "../../shared/types.js";

export type ApiRequest = IncomingMessage & {
  method?: string;
  url?: string;
};

export type ApiResponse = ServerResponse<IncomingMessage>;

const snapshot = publicSnapshot as PublicDataSnapshot;

export function json(
  response: ApiResponse,
  status: number,
  payload: unknown,
  cacheControl = "public, s-maxage=300, stale-while-revalidate=300"
) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", cacheControl);
  response.end(JSON.stringify(payload));
}

export function parseRequestUrl(request: ApiRequest): URL {
  return new URL(request.url ?? "/", "https://warwatch.local");
}

export function handleHealth(response: ApiResponse) {
  return json(
    response,
    200,
    {
      ok: true,
      mode: "public_readonly",
      generatedAt: snapshot.generatedAt
    },
    "public, max-age=60"
  );
}

export function handleOverview(response: ApiResponse) {
  return json(response, 200, snapshot.overview, "public, max-age=60");
}

export function handleEvents(request: ApiRequest, response: ApiResponse) {
  const url = parseRequestUrl(request);
  const category = url.searchParams.get("category");
  const limit = Number(url.searchParams.get("limit") ?? "200");
  const events = snapshot.events.filter((event) => !category || event.category === category);
  return json(response, 200, events.slice(0, Number.isFinite(limit) ? limit : 200));
}

export function handleEvent(response: ApiResponse, id: string) {
  const event = findSnapshotEvent(snapshot, decodeURIComponent(id));
  return event
    ? json(response, 200, event)
    : json(response, 404, { error: "Event not found" }, "public, max-age=60");
}

export function handleMetricHistory(response: ApiResponse, key: string) {
  return json(response, 200, snapshot.metrics[decodeURIComponent(key)] ?? []);
}

export function handleBriefings(response: ApiResponse) {
  return json(response, 200, snapshot.briefings);
}

export function handleMapLayers(response: ApiResponse) {
  return json(response, 200, snapshot.mapLayers);
}

export function handleStories(request: ApiRequest, response: ApiResponse) {
  const url = parseRequestUrl(request);
  const section = url.searchParams.get("section");
  const stories = section
    ? snapshot.stories.filter((story) => story.section === section)
    : snapshot.stories;
  return json(response, 200, stories);
}

export function handleSources(response: ApiResponse) {
  return json(response, 200, snapshot.sources);
}

export function handleGraph(response: ApiResponse) {
  return json(response, 200, snapshot.graph);
}

export function handleEntityDossier(response: ApiResponse, key: string) {
  const dossier = findSnapshotDossier(snapshot, decodeURIComponent(key));
  return dossier
    ? json(response, 200, dossier)
    : json(response, 404, { error: "Entity dossier not found" }, "public, max-age=60");
}

export function handleOperatorUnavailable(response: ApiResponse) {
  return json(
    response,
    403,
    {
      error: "Operator workflows stay local in hosted public mode."
    },
    "public, max-age=60"
  );
}
