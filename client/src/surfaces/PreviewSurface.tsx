import type { BriefingRecord, FrontSummary, MetricSnapshot, OverviewResponse, StoryRecord } from "@shared/types";
import { formatDate, formatDateTime, formatSignedPercent } from "../lib/format";

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

export default function PreviewSurface({
  overview,
  frontStories,
  achievementStories,
  briefings,
  marketSignals
}: {
  overview: OverviewResponse | null;
  frontStories: StoryRecord[];
  achievementStories: StoryRecord[];
  briefings: BriefingRecord[];
  marketSignals: Record<string, MetricSnapshot[]>;
}) {
  const latestBriefing = briefings[0] ?? null;
  const briefingHighlights = getBriefingHighlights(briefings);
  const sourceMix = Array.from(
    new Set([...frontStories, ...achievementStories].map((story) => story.sourceText))
  ).slice(0, 4);

  return (
    <div
      className="space-y-6"
      data-preview="preview-surface"
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="relative overflow-hidden rounded-[32px] border border-line/80 bg-shell/78 p-6 shadow-shell sm:p-7">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-signal/12 blur-3xl" />
            <div className="absolute right-0 top-10 h-44 w-44 rounded-full bg-ember/10 blur-3xl" />
          </div>
          <div className="relative">
            <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-signal/72">
              Snapshot
            </p>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <h2 className="font-display text-4xl leading-none text-white sm:text-5xl">
                  {overview?.headline.label ?? "Public war posture"}
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-calm/84">
                  {overview?.headline.description ??
                    "Public-facing orientation over a review-gated intelligence shell."}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3 text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-calm/60">
                  Current day
                </p>
                <p className="mt-2 font-display text-3xl text-white">
                  {overview?.currentDay ?? "..."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                ["Public stale flag", overview?.stale ? "YES" : "NO", "Whether public top-line truth still carries seed-era values"],
                [
                  "Top-line freshness",
                  overview?.freshness.topLine ?? "unknown",
                  "Public top-line metrics only clear when reviewed or current"
                ],
                [
                  "Last successful ingest",
                  overview?.freshness.lastSuccessfulIngestionAt
                    ? formatDateTime(overview.freshness.lastSuccessfulIngestionAt)
                    : "none",
                  "Feed and market lanes continue refreshing behind the public shell"
                ]
              ].map(([label, value, detail]) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">
                    {label}
                  </p>
                  <p className="mt-3 font-display text-2xl text-white">{value}</p>
                  <p className="mt-3 text-sm leading-6 text-calm/78">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-[32px] border border-line/80 bg-shell/78 p-6 shadow-shell sm:p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-signal/72">
            Latest SITREP
          </p>
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-3xl text-white">
                {latestBriefing?.title ?? "Awaiting current briefing"}
              </h2>
              <p className="mt-2 text-sm text-calm/70">
                {latestBriefing ? formatDate(latestBriefing.briefingDate) : "No approved briefing yet"}
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">
              {latestBriefing ? `${latestBriefing.reviewState} / ${latestBriefing.publishState}` : "draft"}
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {(briefingHighlights.length ? briefingHighlights : ["No current briefing highlights yet."]).map(
              (line) => (
                <div
                  key={line}
                  className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-sm leading-6 text-calm/84">{line}</p>
                </div>
              )
            )}
          </div>
          <div className="mt-5 rounded-[22px] border border-signal/18 bg-signal/8 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/80">
              Why this matters
            </p>
            <p className="mt-2 text-sm leading-6 text-calm/84">
              The public lane now has a readable briefing surface, live market context, and explicit freshness posture without exposing the operator-only review workflow.
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {overview?.kpis.map((item) => (
          <article
            key={item.key}
            className="rounded-[26px] border border-line/80 bg-shell/72 p-5 shadow-shell"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal/72">
              {item.label}
            </p>
            <h3 className="mt-4 font-display text-3xl text-white">{item.value}</h3>
            <p className="mt-3 text-sm leading-6 text-calm/82">{item.supportingText}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">
              {item.freshness}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[30px] border border-line/80 bg-shell/72 p-6 shadow-shell">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal/72">
                Fronts
              </p>
              <h2 className="mt-2 font-display text-3xl text-white">Conflict line posture</h2>
            </div>
            <p className="max-w-[22rem] text-sm leading-6 text-calm/78">
              Curated fronts keep the public shell legible while still reflecting significance and review posture.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(overview?.fronts ?? []).slice(0, 4).map((front) => (
              <article
                key={front.id}
                className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
              >
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

        <article className="rounded-[30px] border border-line/80 bg-shell/72 p-6 shadow-shell">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal/72">
                Market pressure
              </p>
              <h2 className="mt-2 font-display text-3xl text-white">Live signals at a glance</h2>
            </div>
            <p className="max-w-[18rem] text-sm leading-6 text-calm/78">
              The public preview lane shows whether market stress is reinforcing the current conflict story.
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {marketDefinitions.map((definition) => {
              const summary = latestMetricSummary(marketSignals[definition.key] ?? []);
              return (
                <article
                  key={definition.key}
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">
                        {definition.label}
                      </p>
                      <h3 className="mt-2 font-display text-3xl text-white">{summary.value}</h3>
                      <p className="mt-2 text-sm text-calm/80">{definition.detail}</p>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/78">
                      {summary.delta}
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-calm/62">Last update {summary.updatedAt}</p>
                </article>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[30px] border border-line/80 bg-shell/72 p-6 shadow-shell">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal/72">
            Why trust this
          </p>
          <h2 className="mt-2 font-display text-3xl text-white">Public-safe by design</h2>
          <div className="mt-5 grid gap-3">
            {[
              {
                label: "Critical claims stay gated",
                detail: "The public shell does not auto-promote critical items without an operator review path."
              },
              {
                label: "Freshness is explicit",
                detail: `Current public queue pressure is ${overview?.queue.pending ?? 0} pending / ${overview?.queue.critical ?? 0} critical, and stale top-line metrics stay labeled until refreshed.`
              },
              {
                label: "Multiple source lanes",
                detail:
                  sourceMix.length > 0
                    ? `Current story mix pulls from ${sourceMix.join(", ")}.`
                    : "The story mix will expand as more reviewed sources are promoted."
              }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/78">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-calm/82">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[30px] border border-line/80 bg-shell/72 p-6 shadow-shell">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal/72">
                Story stack
              </p>
              <h2 className="mt-2 font-display text-3xl text-white">What moved the public picture</h2>
            </div>
            <p className="max-w-[18rem] text-sm leading-6 text-calm/78">
              A compact working set for demos, screenshots, and quick orientation.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[...frontStories, ...achievementStories].slice(0, 4).map((story) => (
              <article
                key={story.id}
                className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{story.title}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">
                    {story.significance}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-calm/82">{story.summary}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                  {story.sourceText}
                </p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
