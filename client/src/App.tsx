import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState
} from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import clsx from "clsx";
import type {
  BriefingRecord,
  EventRecord,
  IngestionRun,
  MapFeature,
  MetricSnapshot,
  OverviewResponse,
  ReviewQueueItem,
  SourceRecord,
  StoryRecord
} from "@shared/types";
import { api } from "./lib/api";
import { TheaterMap } from "./components/TheaterMap";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const surfaces = [
  { id: "command", label: "Command" },
  { id: "timeline", label: "Timeline" },
  { id: "signals", label: "Signals" },
  { id: "briefings", label: "Briefings" },
  { id: "operator", label: "Operator" }
] as const;

type SurfaceId = (typeof surfaces)[number]["id"];

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function EventRow({ event }: { event: EventRecord }) {
  return (
    <article className="grid gap-3 border-b border-white/6 py-4 md:grid-cols-[9rem_1fr]">
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-calm/72">
        <p>{formatDate(event.date)}</p>
        <p className="mt-2 text-signal/80">{event.category.replace(/_/g, " ")}</p>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-calm/70">
            {event.significance}
          </span>
          <span className="rounded-full border border-signal/20 bg-signal/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-signal">
            {event.confidence}
          </span>
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-calm/82">{event.detail}</p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-calm/60">
          {event.sourceText}
        </p>
      </div>
    </article>
  );
}

function StoryStrip({
  title,
  copy,
  items
}: {
  title: string;
  copy: string;
  items: StoryRecord[];
}) {
  return (
    <section className="space-y-5 rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
            {title}
          </p>
          <h2 className="font-display text-2xl text-white">{copy}</h2>
        </div>
        <p className="max-w-[20rem] text-sm text-calm/78">
          Public-facing working set backed by the canonical store.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {items.slice(0, 6).map((item) => (
          <article
            key={item.id}
            className="space-y-3 border-t border-white/8 pt-4 lg:border-t-0 lg:border-l lg:pl-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-calm/62">
                {item.significance}
              </span>
            </div>
            <p className="text-sm leading-6 text-calm/84">{item.detail}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal/70">
              {item.sourceText}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SourceTable({ sources }: { sources: SourceRecord[] }) {
  return (
    <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
            Source posture
          </p>
          <h2 className="font-display text-2xl text-white">Reliability and bias ledger</h2>
        </div>
        <p className="max-w-[22rem] text-sm text-calm/78">
          Public shell now separates source weighting from event display instead of flattening every source into a single feed.
        </p>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="font-mono text-[11px] uppercase tracking-[0.22em] text-calm/62">
            <tr>
              <th className="border-b border-white/8 pb-3 pr-5">Source</th>
              <th className="border-b border-white/8 pb-3 pr-5">Type</th>
              <th className="border-b border-white/8 pb-3 pr-5">Reliability</th>
              <th className="border-b border-white/8 pb-3">Bias</th>
            </tr>
          </thead>
          <tbody>
            {sources.slice(0, 12).map((source) => (
              <tr key={source.id}>
                <td className="border-b border-white/6 py-3 pr-5 text-white">{source.name}</td>
                <td className="border-b border-white/6 py-3 pr-5 text-calm/82">{source.type}</td>
                <td className="border-b border-white/6 py-3 pr-5 text-calm/82">
                  {(source.reliabilityScore * 100).toFixed(0)}%
                </td>
                <td className="border-b border-white/6 py-3 text-calm/82">{source.biasDirection}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BriefingDeck({ briefings }: { briefings: BriefingRecord[] }) {
  return (
    <div className="grid gap-5">
      {briefings.map((briefing) => (
        <article
          key={briefing.id}
          className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
                {briefing.title}
              </p>
              <h2 className="font-display text-2xl text-white">{formatDate(briefing.briefingDate)}</h2>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-calm/64">
              {briefing.reviewState} / {briefing.publishState}
            </p>
          </div>
          <pre className="mt-5 whitespace-pre-wrap font-body text-sm leading-7 text-calm/82">
            {briefing.body}
          </pre>
        </article>
      ))}
    </div>
  );
}

function OperatorPanel({
  queue,
  runs,
  onApprove,
  onReject,
  onIngest,
  operatorError
}: {
  queue: ReviewQueueItem[];
  runs: IngestionRun[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onIngest: () => void;
  operatorError: string | null;
}) {
  if (operatorError) {
    return (
      <section className="rounded-[28px] border border-hostile/30 bg-hostile/10 p-5 text-calm">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hostile">Operator access</p>
        <p className="mt-3 text-sm leading-6">
          {operatorError}
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
              Review queue
            </p>
            <h2 className="font-display text-2xl text-white">Critical promotion gate</h2>
          </div>
          <button
            type="button"
            onClick={onIngest}
            className="rounded-full border border-signal/25 bg-signal/12 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-signal transition hover:bg-signal/18"
          >
            Run ingest
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {queue.map((item) => (
            <article
              key={item.id}
              className="rounded-[22px] border border-white/8 bg-white/[0.025] p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-hostile/78">
                    {item.severity}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-calm/82">{item.reason}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onApprove(item.id)}
                    className="rounded-full border border-[#2f9d65]/25 bg-[#2f9d65]/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#7ef5b0]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(item.id)}
                    className="rounded-full border border-hostile/25 bg-hostile/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-hostile"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-calm/58">
                {item.itemType} · {formatDateTime(item.updatedAt)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
          Ingestion runs
        </p>
        <h2 className="mt-2 font-display text-2xl text-white">Feed health</h2>
        <div className="mt-5 space-y-4">
          {runs.map((run) => (
            <article
              key={run.id}
              className="rounded-[22px] border border-white/8 bg-white/[0.025] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{run.feedName}</h3>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-calm/58">
                    {run.runType} · {formatDateTime(run.startedAt)}
                  </p>
                </div>
                <span
                  className={clsx(
                    "rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em]",
                    run.status === "success"
                      ? "border border-[#2f9d65]/25 bg-[#2f9d65]/10 text-[#7ef5b0]"
                      : "border border-hostile/25 bg-hostile/10 text-hostile"
                  )}
                >
                  {run.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-calm/82">{run.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [surface, setSurface] = useState<SurfaceId>("command");
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [briefings, setBriefings] = useState<BriefingRecord[]>([]);
  const [mapLayers, setMapLayers] = useState<Record<string, MapFeature[]>>({});
  const [history, setHistory] = useState<MetricSnapshot[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [ingestionRuns, setIngestionRuns] = useState<IngestionRun[]>([]);
  const [search, setSearch] = useState("");
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  async function loadPublicData() {
    const [nextOverview, nextEvents, nextStories, nextSources, nextBriefings, nextMapLayers, nextHistory] =
      await Promise.all([
        api.overview(),
        api.events(),
        api.stories(),
        api.sources(),
        api.briefings(),
        api.mapLayers(),
        api.metricHistory("daily_event_volume")
      ]);

    setOverview(nextOverview);
    setEvents(nextEvents);
    setStories(nextStories);
    setSources(nextSources);
    setBriefings(nextBriefings);
    setMapLayers(nextMapLayers);
    setHistory(nextHistory);
  }

  async function loadOperatorData() {
    try {
      const [queue, runs] = await Promise.all([api.reviewQueue(), api.ingestionRuns()]);
      setReviewQueue(queue);
      setIngestionRuns(runs);
      setOperatorError(null);
    } catch (error) {
      setOperatorError(error instanceof Error ? error.message : "Operator surface unavailable");
    }
  }

  useEffect(() => {
    void loadPublicData();
    void loadOperatorData();
  }, []);

  async function handleApprove(id: string) {
    await api.approveQueueItem(id);
    await Promise.all([loadPublicData(), loadOperatorData()]);
  }

  async function handleReject(id: string) {
    await api.rejectQueueItem(id);
    await Promise.all([loadPublicData(), loadOperatorData()]);
  }

  async function handleRunIngest() {
    await api.runIngest();
    await Promise.all([loadPublicData(), loadOperatorData()]);
  }

  const filteredEvents = events.filter((event) => {
    if (!deferredSearch.trim()) {
      return true;
    }

    const haystack = `${event.title} ${event.detail} ${event.sourceText} ${event.category}`.toLowerCase();
    return haystack.includes(deferredSearch.toLowerCase());
  });

  const frontStories = stories.filter((story) => story.section === "front");
  const indicatorStories = stories.filter((story) => story.section === "indicator");
  const achievementStories = stories.filter((story) => story.section === "achievement");

  const chartData = {
    labels: history.map((item) => formatDate(item.timestamp.slice(0, 10))),
    datasets: [
      {
        label: "Daily event volume",
        data: history.map((item) => item.value ?? 0),
        borderColor: "#59d3ff",
        backgroundColor: "rgba(89, 211, 255, 0.18)",
        fill: true,
        tension: 0.32
      }
    ]
  };

  return (
    <div className="min-h-screen bg-radar font-body text-calm">
      <div className="mx-auto flex min-h-screen max-w-[90rem] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[36px] border border-line/80 bg-[#07111b]/90 px-6 py-6 shadow-shell sm:px-8">
          <div className="absolute inset-0 opacity-60">
            <div className="absolute -left-10 top-8 h-36 w-36 rounded-full bg-signal/15 blur-3xl" />
            <div className="absolute right-4 top-6 h-44 w-44 rounded-full bg-ember/15 blur-3xl" />
            <div className="grid-radar absolute inset-0 animate-pulseGrid bg-[radial-gradient(circle_at_center,rgba(89,211,255,0.1)_1px,transparent_1px)] bg-[size:22px_22px]" />
          </div>
          <div className="relative flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-signal/72">
                  WarWatch V4
                </p>
                <h1 className="mt-3 font-display text-4xl leading-none text-white sm:text-5xl">
                  Public intelligence shell with explicit review control.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-calm/82 sm:text-lg">
                  Cold-radar command center over a verified data spine: public surfaces stay useful, but critical claims do not skip the operator lane.
                </p>
              </div>
              <div className="grid gap-3 rounded-[28px] border border-white/8 bg-white/[0.04] p-5 font-mono text-[11px] uppercase tracking-[0.2em] text-calm/72 sm:min-w-[18rem]">
                <div className="flex items-center justify-between">
                  <span>Current day</span>
                  <span className="text-white">{overview?.currentDay ?? "..."}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Legacy as of</span>
                  <span className="text-white">{overview?.legacyAsOf ?? "..."}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pending queue</span>
                  <span className="text-white">{overview?.queue.pending ?? "..."}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last ingest</span>
                  <span className="text-white">{overview?.queue.lastIngestionStatus ?? "..."}</span>
                </div>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              {surfaces.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    startTransition(() => setSurface(item.id));
                  }}
                  className={clsx(
                    "rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition",
                    surface === item.id
                      ? "border-signal/30 bg-signal/12 text-signal"
                      : "border-white/10 bg-white/[0.03] text-calm/72 hover:border-white/20 hover:text-white"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="mt-6 flex-1 space-y-6 pb-10">
          {surface === "command" && (
            <>
              <section className="grid gap-4 lg:grid-cols-4">
                {overview?.kpis.map((item) => (
                  <article
                    key={item.key}
                    className="rounded-[24px] border border-line/80 bg-shell/72 p-5 shadow-shell"
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal/72">
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
                <TheaterMap layers={mapLayers} />
                <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
                  <div className="flex flex-col gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
                      Tempo
                    </p>
                    <h2 className="font-display text-2xl text-white">Daily event volume from the seeded chronology</h2>
                  </div>
                  <div className="mt-5">
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: {
                            ticks: { color: "#9ab1c2", maxTicksLimit: 8 }
                          },
                          y: {
                            ticks: { color: "#9ab1c2" },
                            grid: { color: "rgba(255,255,255,0.08)" }
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="mt-5 space-y-3">
                    {overview?.fronts.map((front) => (
                      <article
                        key={front.id}
                        className="border-t border-white/8 pt-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {front.icon ? `${front.icon} ` : ""}
                            {front.title}
                          </h3>
                          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">
                            {front.significance}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-calm/82">{front.status}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </section>

              <StoryStrip
                title="Fronts"
                copy="Conflict lines with explicit public posture"
                items={frontStories}
              />

              <StoryStrip
                title="Achievement / risk stories"
                copy="Narrative and accountability threads"
                items={achievementStories}
              />
            </>
          )}

          {surface === "timeline" && (
            <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
                    Timeline
                  </p>
                  <h2 className="font-display text-2xl text-white">Chronology with search and confidence state</h2>
                </div>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search events, sources, categories"
                  className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-calm/40 md:max-w-sm"
                />
              </div>
              <div className="mt-6">
                {filteredEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                  />
                ))}
              </div>
            </section>
          )}

          {surface === "signals" && (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <StoryStrip
                title="Signals"
                copy="Unconventional indicators with explicit source labeling"
                items={indicatorStories}
              />
              <SourceTable sources={sources} />
            </div>
          )}

          {surface === "briefings" && <BriefingDeck briefings={briefings} />}

          {surface === "operator" && (
            <OperatorPanel
              queue={reviewQueue}
              runs={ingestionRuns}
              onApprove={handleApprove}
              onReject={handleReject}
              onIngest={handleRunIngest}
              operatorError={operatorError}
            />
          )}
        </main>
      </div>
    </div>
  );
}

