import fs from "node:fs";
import path from "node:path";
import type { EntityDossier, EventRecord, PublicDataSnapshot } from "../shared/types.js";

export const publicMetricHistoryKeys = [
  "daily_event_volume",
  "oil_brent",
  "oil_wti",
  "gold_price"
] as const;

export function getPublicSnapshotPath(rootDir: string): string {
  return path.resolve(rootDir, "data/public-snapshot.json");
}

export function loadPublicSnapshot(rootDir: string): PublicDataSnapshot {
  const snapshotPath = getPublicSnapshotPath(rootDir);
  return JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as PublicDataSnapshot;
}

export function findSnapshotEvent(snapshot: PublicDataSnapshot, id: string): EventRecord | null {
  return snapshot.events.find((event) => event.id === id) ?? null;
}

export function findSnapshotDossier(snapshot: PublicDataSnapshot, key: string): EntityDossier | null {
  return (
    snapshot.dossiers.find((dossier) => dossier.entity.id === key || dossier.entity.slug === key) ?? null
  );
}
