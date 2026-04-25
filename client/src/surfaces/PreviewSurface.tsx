import type {
  BriefingRecord,
  FrontSummary,
  GraphSnapshot,
  MetricSnapshot,
  OverviewResponse,
  StoryRecord
} from "@shared/types";
import { formatDate, formatDateTime, formatSignedPercent } from "../lib/format";
import { findEntitiesByText } from "../lib/canonical-linking";

const marketDefinitions = [
  {
    key: "oil_brent",
    label: "Brent",
    detail: "Global crude marker"
  },
  {
    key: "oil_wti",
    label: "WTI",
    detail: "US benchmark"
  },
  {
    key: "gold_price",
    label: "Gold",
    detail: "Risk-off signal"
  }
] as const;

const publicPaths = [
  {
    title: "Read the daily SITREP",
    surface: "briefings" as const,
    detail: "Operator-approved daily briefings with structured sections, highlights, and archive context."
  },
  {
    title: "Track the timeline",
    surface: "timeline" as const,
    detail: "Filterable chronology with corroboration, significance, and public posture detail."
  },
  {
    title: "Follow actors and claims",
    surface: "dossiers" as const,
    detail: "Canonical actor dossiers, linked claims, and evidence paths across the public graph."
  },
  {
    title: "Watch market pressure",
    surface: "signals" as const,
    detail: "Live Brent, WTI, gold, and source posture for economic and narrative pressure."
  }
] as const;

function getBriefingHighlights(briefings: BriefingRecord[]): string[] {
  const briefing = briefings[0];
  if (!briefing) {
    return [];
  }

  return briefing.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.toLowerCase().startsWith("sources:"))
    .slice(0, 4)
    .map((line) => line.replace(/^- /, ""));
}

function latestMetricSummary(series: MetricSnapshot[]) {
  const rows = series.filter((row) => row.value !== null);
  const current = rows.at(-1);
  const previous = rows.at(-2);
  if (!current) {
    return {
      value: "No data",
      delta: "Awaiting live snapshots",
      updatedAt: "No update yet"
    };
  }

  let delta = "No prior comparison";
  if (
    current.value !== null &&
    previous?.value !== null &&
    previous?.value !== undefined &&
    previous.value !== 0
  ) {
    delta = `${formatSignedPercent(((current.value - previous.value) / previous.value) * 100)} vs prior print`;
  }

  return {
    value: current.valueText ?? "No data",
    delta,
    updatedAt: formatDateTime(current.timestamp)
  };
}

function frontTone(front: FrontSummary["significance"]): string {
  if (front === "critical") {
    return "text-hostile";
  }
  if (front === "high") {
    return "text-warning";
  }
  return "text-signal";
}

function freshnessTone(freshness: string | null | undefined): string {
  if (freshness === "operator_hold") {
    return "text-warning";
  }
  if (freshness === "live" || freshness === "ingested" || freshness === "operator_reviewed") {
    return "text-signal";
  }
  if (freshness?.includes("seed")) {
    return "text-hostile";
  }
  return "text-calm";
}

export default function PreviewSurface({
  overview,
  frontStories,
  achievementStories,
  briefings,
  marketSignals,
  graph,
  onOpenEntity,
  onOpenSurface
}: {
  overview: OverviewResponse | null;
  frontStories: StoryRecord[];
  achievementStories: StoryRecord[];
  briefings: BriefingRecord[];
  marketSignals: Record<string, MetricSnapshot[]>;
  graph: GraphSnapshot;
  onOpenEntity?: (key: string) => void;
  onOpenSurface?: (
    surface: "preview" | "command" | "timeline" | "dossiers" | "signals" | "briefings" | "operator"
  ) => void;
}) {
  const latestBriefing = briefings[0] ?? null;
  const briefingHighlights = getBriefingHighlights(briefings);
  const sourceMix = Array.from(
    new Set([...frontStories, ...achievementStories].map((story) => story.sourceText))
  ).slice(0, 4);
  const dossierEntries = graph.entities
    .map((entity) => {
      const relationshipCount = graph.relationships.filter(
        (relationship) => relationship.fromEntityId === entity.id || relationship.toEntityId === entity.id
      ).length;
      const claimCount = graph.claims.filter((claim) =>
        findEntitiesByText(graph.entities, claim.title, claim.statement, claim.status).some(
          (candidate) => candidate.id === entity.id
        )
      ).length;
      const storyCount = [...frontStories, ...achievementStories].filter((story) =>
        findEntitiesByText(graph.entities, story.title, story.summary, story.detail, story.sourceText).some(
          (candidate) => candidate.id === entity.id
        )
      ).length;
      const briefingCount = latestBriefing
        ? findEntitiesByText(graph.entities, latestBriefing.title, latestBriefing.body).some(
            (candidate) => candidate.id === entity.id
          )
          ? 1
          : 0
        : 0;

      return {
        entity,
        relationshipCount,
        claimCount,
        storyCount,
        briefingCount,
        score: storyCount * 5 + claimCount * 4 + relationshipCount * 2 + briefingCount * 3
      };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.relationshipCount - left.relationshipCount ||
        left.entity.name.localeCompare(right.entity.name)
    )
    .slice(0, 4);
  const homeTone =
    overview?.headline.description ??
    "Review-gated public briefing site over a canonical intelligence spine.";

  return (
    <div
      className="space-y-10"
      data-preview="preview-surface"
    >
      <section className="-mx-3 sm:-mx-6 lg:-mx-8">
        <article className="site-hero relative overflow-hidden px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          <div className="absolute inset-0 opacity-80">
            <div className="absolute -left-16 top-0 h-52 w-52 rounded-full bg-signal/14 blur-3xl" />
            <div className="absolute right-0 top-8 h-56 w-56 rounded-full bg-ember/12 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent" />
            <div className="grid-radar absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(89,211,255,0.09)_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          <div className="relative grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="max-w-3xl">
              <p className="eyebrow-label">WarWatch</p>
              <p className={`mt-5 font-mono text-[11px] uppercase tracking-[0.28em] ${freshnessTone(overview?.freshness.topLine)}`}>
                {overview?.freshness.topLine === "review_hold"
                  ? "Evidence-bound public briefing"
                  : overview?.headline.label ?? "Public intelligence shell"}
              </p>
              <h2 className="mt-4 max-w-4xl font-display text-[clamp(3rem,10vw,6.8rem)] leading-[0.84] text-white">
                Public briefing website for the Iran conflict.
              </h2>
              <p className="mt-5 max-w-2xl text-[1rem] leading-7 text-calm/86 sm:text-[1.15rem] sm:leading-8">
                {homeTone}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onOpenSurface?.("briefings")}
                  className="site-cta site-cta--primary"
                >
                  Read latest SITREP
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSurface?.("timeline")}
                  className="site-cta site-cta--secondary"
                >
                  Track the timeline
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSurface?.("dossiers")}
                  className="site-cta site-cta--secondary"
                >
                  Explore dossiers
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  [
                    "Top-line freshness",
                    overview?.freshness.topLine ?? "unknown",
                    "Public top-line metrics only clear when they are live or operator-reviewed."
                  ],
                  [
                    "Last successful ingest",
                    overview?.freshness.lastSuccessfulIngestionAt
                      ? formatDateTime(overview.freshness.lastSuccessfulIngestionAt)
                      : "none",
                    "Feed and market lanes refresh independently of the public publication gate."
                  ],
                  [
                    "Review queue",
                    `${overview?.queue.pending ?? 0} pending / ${overview?.queue.critical ?? 0} critical`,
                    "Critical queue pressure is visible instead of being hidden behind the public shell."
                  ]
                ].map(([label, value, detail]) => (
                  <div key={label} className="site-hero-stat">
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-calm/56">{label}</p>
                    <p className="mt-3 font-display text-[1.65rem] leading-none text-white">{value}</p>
                    <p className="mt-3 text-sm leading-6 text-calm/76">{detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <article className="site-briefing-panel">
                <p className="eyebrow-label">Latest briefing</p>
                <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="font-display text-[clamp(2rem,4vw,3.4rem)] leading-[0.92] text-white">
                      {latestBriefing?.title ?? "Awaiting current briefing"}
                    </h3>
                    <p className="mt-2 text-sm text-calm/70">
                      {latestBriefing ? formatDate(latestBriefing.briefingDate) : "No approved briefing yet"}
                    </p>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">
                    {latestBriefing ? `${latestBriefing.reviewState} / ${latestBriefing.publishState}` : "draft"}
                  </p>
                </div>
                <div className="mt-5 space-y-3">
                  {(briefingHighlights.length ? briefingHighlights : ["No current briefing highlights yet."]).map(
                    (line) => (
                      <div key={line} className="border-b border-white/8 pb-3 last:border-b-0 last:pb-0">
                        <p className="text-sm leading-6 text-calm/84">{line}</p>
                      </div>
                    )
                  )}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenSurface?.("briefings")}
                    className="site-cta site-cta--primary"
                  >
                    Open full briefing
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenSurface?.("signals")}
                    className="site-cta site-cta--secondary"
                  >
                    Open signals
                  </button>
                </div>
              </article>

              <article className="site-method-panel">
                <p className="eyebrow-label">Public method</p>
                <div className="mt-4 grid gap-3">
                  {[
                    "Critical claims stay review-gated before promotion.",
                    "Top-line metrics now surface live, reviewed, or evidence-bound hold posture explicitly.",
                    sourceMix.length > 0
                      ? `Current public story mix draws from ${sourceMix.join(", ")}.`
                      : "Source mix expands only when reviewed material is promoted into the public shell."
                  ].map((line) => (
                    <div key={line} className="border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-sm leading-6 text-calm/82">{line}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow-label">Top line</p>
            <h2 className="section-heading mt-2 text-[2.5rem]">Public posture in one scan</h2>
          </div>
          <p className="section-copy max-w-[30rem]">
            The public site now distinguishes current values, reviewed holds, and seed-era history instead of flattening them into one visual treatment.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {(overview?.kpis ?? []).map((item) => (
            <article
              key={item.key}
              className={`metric-tile p-5 ${item.freshness === "operator_hold" ? "border-warning/18" : ""}`}
            >
              <p className="eyebrow-label text-[10px]">{item.label}</p>
              <h3 className="mt-4 font-display text-[2rem] leading-none text-white">{item.value}</h3>
              <p className="mt-3 text-sm leading-6 text-calm/82">{item.supportingText}</p>
              <p className={`mt-4 font-mono text-[10px] uppercase tracking-[0.22em] ${freshnessTone(item.freshness)}`}>
                {item.freshness}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="shell-panel p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow-label">Use the site</p>
              <h2 className="section-heading mt-2 text-[2.45rem]">Start from a public question, not a dashboard lane</h2>
            </div>
            <p className="section-copy max-w-[22rem]">
              These entry points turn the shell into a readable website instead of forcing first-time visitors into an operator mental model.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {publicPaths.map((pathItem) => (
              <button
                key={pathItem.title}
                type="button"
                onClick={() => onOpenSurface?.(pathItem.surface)}
                className="pathway-block text-left"
              >
                <p className="font-display text-[1.55rem] leading-none text-white">{pathItem.title}</p>
                <p className="mt-3 text-sm leading-6 text-calm/80">{pathItem.detail}</p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-signal/74">
                  Open {pathItem.surface}
                </p>
              </button>
            ))}
          </div>
        </article>

        <article className="shell-panel shell-panel-editorial p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow-label">Conflict line posture</p>
              <h2 className="section-heading mt-2 text-[2.45rem]">Where the pressure is sitting</h2>
            </div>
            <p className="section-copy max-w-[18rem]">
              Curated fronts keep the public site scannable while still surfacing significance and posture.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(overview?.fronts ?? []).slice(0, 4).map((front) => (
              <article key={front.id} className="subtle-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{front.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-calm/82">{front.summary}</p>
                  </div>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${frontTone(front.significance)}`}>
                    {front.significance}
                  </span>
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">
                  {front.status}
                </p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="shell-panel p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow-label">Signals and method</p>
              <h2 className="section-heading mt-2 text-[2.45rem]">Economic stress and publication discipline</h2>
            </div>
            <p className="section-copy max-w-[20rem]">
              Markets move faster than public truth. WarWatch now shows that difference instead of pretending every top-line field is equally current.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {marketDefinitions.map((definition) => {
              const summary = latestMetricSummary(marketSignals[definition.key] ?? []);
              return (
                <article key={definition.key} className="subtle-card p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">{definition.label}</p>
                  <h3 className="mt-3 font-display text-[2rem] leading-none text-white">{summary.value}</h3>
                  <p className="mt-3 text-sm leading-6 text-calm/80">{definition.detail}</p>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-signal/76">{summary.delta}</p>
                  <p className="mt-2 text-xs text-calm/60">Last update {summary.updatedAt}</p>
                </article>
              );
            })}
          </div>
        </article>

        <article className="shell-panel p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow-label">Story stack</p>
              <h2 className="section-heading mt-2 text-[2.45rem]">What changed the public picture</h2>
            </div>
            <p className="section-copy max-w-[18rem]">
              The home surface now behaves like an editorial front page, not a tile dump.
            </p>
          </div>
          <div className="mt-6 space-y-3">
            {[...frontStories, ...achievementStories].slice(0, 4).map((story) => (
              <article key={story.id} className="border-b border-white/8 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{story.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-calm/82">{story.summary}</p>
                  </div>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${frontTone(story.significance)}`}>
                    {story.significance}
                  </span>
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-signal/74">
                  {story.sourceText}
                </p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section
        className="shell-panel p-6"
        data-preview="preview-dossiers"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow-label">Theater dossiers</p>
            <h2 className="section-heading mt-2 text-[2.45rem]">Actors shaping the current picture</h2>
          </div>
          <p className="section-copy max-w-[22rem]">
            Home now links straight into the canonical graph so visitors can move from a public briefing into actor-level context without dead ends.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dossierEntries.map((entry) => (
            <article
              key={entry.entity.id}
              className="subtle-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{entry.entity.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-calm/82">{entry.entity.summary}</p>
                </div>
                <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                  {entry.entity.kind}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                  {entry.relationshipCount} links
                </span>
                <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                  {entry.claimCount} claims
                </span>
                <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                  {entry.storyCount + entry.briefingCount} public threads
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {onOpenEntity ? (
                  <button
                    type="button"
                    onClick={() => onOpenEntity(entry.entity.slug)}
                    className="site-cta site-cta--secondary"
                  >
                    Open dossier
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onOpenSurface?.("dossiers")}
                  className="site-cta site-cta--secondary"
                >
                  Browse graph
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
