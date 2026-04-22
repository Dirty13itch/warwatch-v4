import { lazy, Suspense } from "react";
import type { EntityRecord, MapFeature, MetricSnapshot, OverviewResponse, StoryRecord } from "@shared/types";
import { LoadPanel } from "../components/LoadPanel";
import { StoryStrip } from "../components/StoryStrip";

const LazyTheaterMap = lazy(async () => {
  const module = await import("../components/TheaterMap");
  return { default: module.TheaterMap };
});

const LazyEventVolumeChart = lazy(async () => {
  const module = await import("../components/EventVolumeChart");
  return { default: module.EventVolumeChart };
});

export default function CommandSurface({
  overview,
  frontStories,
  achievementStories,
  entities,
  mapLayers,
  history,
  onOpenEntity
}: {
  overview: OverviewResponse | null;
  frontStories: StoryRecord[];
  achievementStories: StoryRecord[];
  entities: EntityRecord[];
  mapLayers: Record<string, MapFeature[]>;
  history: MetricSnapshot[];
  onOpenEntity?: (key: string) => void;
}) {
  return (
    <div
      className="space-y-6"
      data-preview="command-surface"
    >
      <section className="grid gap-4 lg:grid-cols-4">
        {overview?.kpis.map((item) => (
          <article
            key={item.key}
            className="metric-tile p-5"
          >
            <p className="eyebrow-label">
              {item.label}
            </p>
            <h2 className="mt-4 font-display text-3xl text-white">{item.value}</h2>
            <p className="mt-3 text-sm leading-6 text-calm/82">{item.supportingText}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">
              {item.freshness}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Suspense
          fallback={
            <LoadPanel
              eyebrow="Theater map"
              title="Loading geospatial command surface"
              detail="MapLibre is split into its own chunk so the shell can paint before the heavy geospatial layer arrives."
            />
          }
        >
          <LazyTheaterMap layers={mapLayers} />
        </Suspense>

        <Suspense
          fallback={
            <LoadPanel
              eyebrow="Tempo"
              title="Loading event-volume analytics"
              detail="Charting is split into a deferred chunk so the command shell stays fast while analytical layers load."
            />
          }
        >
          <LazyEventVolumeChart
            history={history}
            fronts={overview?.fronts ?? []}
          />
        </Suspense>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="shell-panel p-5">
          <p className="eyebrow-label">
            Freshness
          </p>
          <h2 className="section-heading mt-2 text-[2rem]">Public truth posture</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="subtle-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">Stale flag</p>
              <p className="mt-3 font-display text-3xl text-white">
                {overview?.stale ? "YES" : "NO"}
              </p>
            </div>
            <div className="subtle-card subtle-card-strong p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">Top-line freshness</p>
              <p className="mt-3 font-display text-3xl text-white">
                {overview?.freshness.topLine ?? "unknown"}
              </p>
            </div>
            <div className="subtle-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">Last successful ingest</p>
              <p className="mt-3 text-sm leading-6 text-calm/82">
                {overview?.freshness.lastSuccessfulIngestionAt ?? "none yet"}
              </p>
            </div>
          </div>
        </article>

        <article className="shell-panel shell-panel-editorial p-5">
          <p className="eyebrow-label">
            Review pressure
          </p>
          <h2 className="section-heading mt-2 text-[2rem]">Queue heat</h2>
          <div className="mt-5 space-y-4">
            <div className="subtle-card subtle-card-warm flex items-center justify-between p-4">
              <span className="text-sm text-calm/82">Pending review items</span>
              <span className="font-display text-3xl text-white">{overview?.queue.pending ?? 0}</span>
            </div>
            <div className="subtle-card subtle-card-warm flex items-center justify-between p-4">
              <span className="text-sm text-calm/82">Critical review items</span>
              <span className="font-display text-3xl text-white">{overview?.queue.critical ?? 0}</span>
            </div>
            <div className="subtle-card flex items-center justify-between p-4">
              <span className="text-sm text-calm/82">Latest ingestion status</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">
                {overview?.queue.lastIngestionStatus ?? "seed-only"}
              </span>
            </div>
          </div>
        </article>
      </section>

      <StoryStrip
        title="Fronts"
        copy="Conflict lines with explicit public posture"
        items={frontStories}
        entities={entities}
        onOpenEntity={onOpenEntity}
      />

      <StoryStrip
        title="Achievement / risk stories"
        copy="Narrative and accountability threads"
        items={achievementStories}
        entities={entities}
        onOpenEntity={onOpenEntity}
      />
    </div>
  );
}
