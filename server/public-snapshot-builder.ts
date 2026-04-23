import type { DatabaseSync } from "node:sqlite";
import {
  getBriefings,
  getEntityDossier,
  getEvents,
  getGraphSnapshot,
  getMapLayers,
  getMetricHistory,
  getOverview,
  getSources,
  getStories
} from "./store.js";
import type { PublicDataSnapshot } from "../shared/types.js";
import { publicMetricHistoryKeys } from "./public-snapshot.js";

export function buildPublicSnapshot(db: DatabaseSync): PublicDataSnapshot {
  const graph = getGraphSnapshot(db);

  return {
    generatedAt: new Date().toISOString(),
    overview: getOverview(db),
    events: getEvents(db, { includeHidden: false, limit: 240 }),
    stories: getStories(db),
    briefings: getBriefings(db),
    sources: getSources(db),
    graph,
    dossiers: graph.entities
      .map((entity) => getEntityDossier(db, entity.slug))
      .filter((dossier): dossier is NonNullable<typeof dossier> => Boolean(dossier)),
    mapLayers: getMapLayers(db),
    metrics: Object.fromEntries(
      publicMetricHistoryKeys.map((key) => [key, getMetricHistory(db, key)])
    )
  };
}
