import type { ApiRequest, ApiResponse } from "./_lib/public-api.js";
import {
  handleBriefings,
  handleEntityDossier,
  handleEvent,
  handleEvents,
  handleGraph,
  handleHealth,
  handleMapLayers,
  handleMetricHistory,
  handleOperatorUnavailable,
  handleOverview,
  handleSources,
  handleStories,
  json
} from "./_lib/public-api.js";

type RoutedApiRequest = ApiRequest & {
  query?: {
    path?: string | string[];
  };
};

function resolvePath(request: RoutedApiRequest): string {
  const routedPath = request.query?.path;
  if (Array.isArray(routedPath) && routedPath.length) {
    return `/${routedPath.join("/")}`;
  }
  if (typeof routedPath === "string" && routedPath.trim()) {
    return `/${routedPath}`;
  }

  const url = new URL(request.url ?? "/", "https://warwatch.local");
  return (url.pathname.replace(/^\/api(?:\/route)?/, "") || "/").replace(/\/+$/, "") || "/";
}

export default function handler(request: RoutedApiRequest, response: ApiResponse) {
  const pathname = resolvePath(request);

  if (pathname === "/health") {
    return handleHealth(response);
  }

  if (pathname === "/overview") {
    return handleOverview(response);
  }

  if (pathname === "/events") {
    return handleEvents(request, response);
  }

  const eventMatch = pathname.match(/^\/events\/([^/]+)$/);
  if (eventMatch) {
    return handleEvent(response, eventMatch[1]);
  }

  const metricMatch = pathname.match(/^\/metrics\/([^/]+)\/history$/);
  if (metricMatch) {
    return handleMetricHistory(response, metricMatch[1]);
  }

  if (pathname === "/briefings") {
    return handleBriefings(response);
  }

  if (pathname === "/map/layers") {
    return handleMapLayers(response);
  }

  if (pathname === "/stories") {
    return handleStories(request, response);
  }

  if (pathname === "/sources") {
    return handleSources(response);
  }

  if (pathname === "/graph") {
    return handleGraph(response);
  }

  const dossierMatch = pathname.match(/^\/entities\/([^/]+)\/dossier$/);
  if (dossierMatch) {
    return handleEntityDossier(response, dossierMatch[1]);
  }

  if (pathname === "/operator" || pathname.startsWith("/operator/")) {
    return handleOperatorUnavailable(response);
  }

  return json(response, 404, { error: "Not found" }, "public, max-age=60");
}
