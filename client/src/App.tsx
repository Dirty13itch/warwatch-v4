import {
  Suspense,
  lazy,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type {
  BriefingRecord,
  ClaimRecord,
  EntityDossier,
  EntityRecord,
  EventRecord,
  IngestionRun,
  MapFeature,
  MetricSnapshot,
  OperatorMetricPublishInput,
  OperatorTopLineSuggestion,
  OperatorTopLineMetric,
  OverviewResponse,
  ReviewQueueDetail,
  ReviewQueueItem,
  ReviewQueueSummary,
  RelationshipRecord,
  SourceRecord,
  StoryRecord
} from "@shared/types";
import { api } from "./lib/api";
import { findEventByReference } from "./lib/canonical-linking";
import PreviewSurface from "./surfaces/PreviewSurface";
import TimelineSurface from "./surfaces/TimelineSurface";
import SignalsSurface from "./surfaces/SignalsSurface";
import BriefingsSurface from "./surfaces/BriefingsSurface";
import { LoadPanel } from "./components/LoadPanel";

const CommandSurface = lazy(() => import("./surfaces/CommandSurface"));
const DossiersSurface = lazy(() => import("./surfaces/DossiersSurface"));
const OperatorSurface = lazy(() => import("./surfaces/OperatorSurface"));

const surfaces = [
  { id: "preview", label: "Snapshot" },
  { id: "command", label: "Command" },
  { id: "timeline", label: "Timeline" },
  { id: "dossiers", label: "Dossiers" },
  { id: "signals", label: "Signals" },
  { id: "briefings", label: "Briefings" },
  { id: "operator", label: "Operator" }
] as const;

type SurfaceId = (typeof surfaces)[number]["id"];

type LoadedState = {
  overview: boolean;
  stories: boolean;
  events: boolean;
  graph: boolean;
  sources: boolean;
  briefings: boolean;
  mapLayers: boolean;
  history: boolean;
  marketSignals: boolean;
  operator: boolean;
};

const initialLoadedState: LoadedState = {
  overview: false,
  stories: false,
  events: false,
  graph: false,
  sources: false,
  briefings: false,
  mapLayers: false,
  history: false,
  marketSignals: false,
  operator: false
};

function headerValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "...";
  }

  return String(value);
}

export default function App() {
  const [surface, setSurface] = useState<SurfaceId>("preview");
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [entities, setEntities] = useState<EntityRecord[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [relationships, setRelationships] = useState<RelationshipRecord[]>([]);
  const [entityDossier, setEntityDossier] = useState<EntityDossier | null>(null);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [briefings, setBriefings] = useState<BriefingRecord[]>([]);
  const [mapLayers, setMapLayers] = useState<Record<string, MapFeature[]>>({});
  const [history, setHistory] = useState<MetricSnapshot[]>([]);
  const [marketSignals, setMarketSignals] = useState<Record<string, MetricSnapshot[]>>({});
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [reviewQueueSummary, setReviewQueueSummary] = useState<ReviewQueueSummary | null>(null);
  const [ingestionRuns, setIngestionRuns] = useState<IngestionRun[]>([]);
  const [topLineMetrics, setTopLineMetrics] = useState<OperatorTopLineMetric[]>([]);
  const [topLineSuggestions, setTopLineSuggestions] = useState<OperatorTopLineSuggestion[]>([]);
  const [search, setSearch] = useState("");
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [focusedEvent, setFocusedEvent] = useState<EventRecord | null>(null);
  const [focusedEntityKey, setFocusedEntityKey] = useState<string | null>(null);
  const [focusedSourceSlug, setFocusedSourceSlug] = useState<string | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [reviewQueueDetail, setReviewQueueDetail] = useState<ReviewQueueDetail | null>(null);
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [publishingMetricKey, setPublishingMetricKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<LoadedState>(initialLoadedState);
  const loadingRef = useRef(new Set<string>());
  const deferredSearch = useDeferredValue(search);

  function markLoaded(next: Partial<LoadedState>) {
    setLoaded((current) => ({ ...current, ...next }));
  }

  async function fetchOverview(force = false) {
    if (!force && (loaded.overview || loadingRef.current.has("overview"))) {
      return;
    }

    loadingRef.current.add("overview");
    try {
      setOverview(await api.overview());
      markLoaded({ overview: true });
    } finally {
      loadingRef.current.delete("overview");
    }
  }

  async function fetchStories(force = false) {
    if (!force && (loaded.stories || loadingRef.current.has("stories"))) {
      return;
    }

    loadingRef.current.add("stories");
    try {
      setStories(await api.stories());
      markLoaded({ stories: true });
    } finally {
      loadingRef.current.delete("stories");
    }
  }

  async function fetchGraph(force = false) {
    if (!force && (loaded.graph || loadingRef.current.has("graph"))) {
      return;
    }

    loadingRef.current.add("graph");
    try {
      const graph = await api.graph();
      setEntities(graph.entities);
      setClaims(graph.claims);
      setRelationships(graph.relationships);
      if (
        !focusedEntityKey ||
        !graph.entities.some((entity) => entity.id === focusedEntityKey || entity.slug === focusedEntityKey)
      ) {
        setFocusedEntityKey(graph.entities[0]?.slug ?? null);
      }
      markLoaded({ graph: true });
      return graph;
    } finally {
      loadingRef.current.delete("graph");
    }
  }

  async function fetchEntityDossier(key: string, force = false) {
    const loadKey = `entityDossier:${key}`;
    if (!force && loadingRef.current.has(loadKey)) {
      return;
    }

    if (
      !force &&
      entityDossier &&
      (entityDossier.entity.id === key || entityDossier.entity.slug === key)
    ) {
      return entityDossier;
    }

    loadingRef.current.add(loadKey);
    try {
      const dossier = await api.entityDossier(key);
      setEntityDossier(dossier);
      return dossier;
    } finally {
      loadingRef.current.delete(loadKey);
    }
  }

  async function fetchEvents(force = false) {
    if (!force && (loaded.events || loadingRef.current.has("events"))) {
      return;
    }

    loadingRef.current.add("events");
    try {
      setEvents(await api.events());
      markLoaded({ events: true });
    } finally {
      loadingRef.current.delete("events");
    }
  }

  async function fetchSources(force = false) {
    if (!force && (loaded.sources || loadingRef.current.has("sources"))) {
      return;
    }

    loadingRef.current.add("sources");
    try {
      setSources(await api.sources());
      markLoaded({ sources: true });
    } finally {
      loadingRef.current.delete("sources");
    }
  }

  async function fetchBriefings(force = false) {
    if (!force && (loaded.briefings || loadingRef.current.has("briefings"))) {
      return;
    }

    loadingRef.current.add("briefings");
    try {
      setBriefings(await api.briefings());
      markLoaded({ briefings: true });
    } finally {
      loadingRef.current.delete("briefings");
    }
  }

  async function fetchMapLayers(force = false) {
    if (!force && (loaded.mapLayers || loadingRef.current.has("mapLayers"))) {
      return;
    }

    loadingRef.current.add("mapLayers");
    try {
      setMapLayers(await api.mapLayers());
      markLoaded({ mapLayers: true });
    } finally {
      loadingRef.current.delete("mapLayers");
    }
  }

  async function fetchHistory(force = false) {
    if (!force && (loaded.history || loadingRef.current.has("history"))) {
      return;
    }

    loadingRef.current.add("history");
    try {
      setHistory(await api.metricHistory("daily_event_volume"));
      markLoaded({ history: true });
    } finally {
      loadingRef.current.delete("history");
    }
  }

  async function fetchMarketSignals(force = false) {
    if (!force && (loaded.marketSignals || loadingRef.current.has("marketSignals"))) {
      return;
    }

    loadingRef.current.add("marketSignals");
    try {
      const [brent, wti, gold] = await Promise.all([
        api.metricHistory("oil_brent"),
        api.metricHistory("oil_wti"),
        api.metricHistory("gold_price")
      ]);
      setMarketSignals({
        oil_brent: brent,
        oil_wti: wti,
        gold_price: gold
      });
      markLoaded({ marketSignals: true });
    } finally {
      loadingRef.current.delete("marketSignals");
    }
  }

  async function fetchOperator(force = false) {
    if (!force && (loaded.operator || loadingRef.current.has("operator"))) {
      return;
    }

    loadingRef.current.add("operator");
    try {
      const [queue, summary, runs, metrics, suggestions] = await Promise.all([
        api.reviewQueue(),
        api.reviewQueueSummary(),
        api.ingestionRuns(),
        api.topLineMetrics(),
        api.topLineSuggestions()
      ]);
      setReviewQueue(queue);
      setReviewQueueSummary(summary);
      setIngestionRuns(runs);
      setTopLineMetrics(metrics);
      setTopLineSuggestions(suggestions);
      if (queue.length && !queue.some((item) => item.id === selectedQueueId)) {
        setSelectedQueueId(queue[0].id);
      }
      setOperatorError(null);
      markLoaded({ operator: true });
    } catch (error) {
      setOperatorError(error instanceof Error ? error.message : "Operator surface unavailable");
      markLoaded({ operator: true });
    } finally {
      loadingRef.current.delete("operator");
    }
  }

  async function ensureSurfaceData(target: SurfaceId, force = false) {
    if (target === "preview") {
      await Promise.all([
        fetchOverview(force),
        fetchStories(force),
        fetchBriefings(force),
        fetchMarketSignals(force),
        fetchGraph(force)
      ]);
      return;
    }

    if (target === "command") {
      await Promise.all([
        fetchOverview(force),
        fetchStories(force),
        fetchGraph(force),
        fetchMapLayers(force),
        fetchHistory(force)
      ]);
      return;
    }

    if (target === "timeline") {
      await Promise.all([fetchEvents(force), fetchSources(force), fetchGraph(force)]);
      return;
    }

    if (target === "dossiers") {
      const graph = (await fetchGraph(force)) ?? {
        entities,
        claims,
        relationships
      };
      const targetKey =
        focusedEntityKey &&
        graph.entities.some((entity) => entity.id === focusedEntityKey || entity.slug === focusedEntityKey)
          ? focusedEntityKey
          : graph.entities[0]?.slug ?? null;

      if (targetKey) {
        await fetchEntityDossier(targetKey, force);
      }
      return;
    }

    if (target === "signals") {
      await Promise.all([fetchStories(force), fetchGraph(force), fetchSources(force), fetchMarketSignals(force)]);
      return;
    }

    if (target === "briefings") {
      await Promise.all([fetchBriefings(force), fetchEvents(force), fetchGraph(force)]);
      return;
    }

    if (target === "operator") {
      await fetchOperator(force);
    }
  }

  useEffect(() => {
    void fetchOverview();
  }, []);

  useEffect(() => {
    void ensureSurfaceData(surface);
  }, [surface]);

  useEffect(() => {
    if (surface !== "operator" || !loaded.operator || !reviewQueue.length) {
      return;
    }

    const targetQueueId =
      selectedQueueId && reviewQueue.some((item) => item.id === selectedQueueId)
        ? selectedQueueId
        : reviewQueue[0].id;

    if (targetQueueId !== selectedQueueId) {
      setSelectedQueueId(targetQueueId);
      return;
    }

    if (reviewQueueDetail?.item.id !== targetQueueId) {
      void fetchReviewQueueDetail(targetQueueId);
    }
  }, [surface, loaded.operator, reviewQueue, selectedQueueId, reviewQueueDetail?.item.id]);

  useEffect(() => {
    if (surface !== "dossiers" || !loaded.graph) {
      return;
    }

    const targetKey = focusedEntityKey ?? entities[0]?.slug ?? null;
    if (!targetKey) {
      return;
    }

    if (
      entityDossier &&
      (entityDossier.entity.id === targetKey || entityDossier.entity.slug === targetKey)
    ) {
      return;
    }

    void fetchEntityDossier(targetKey);
  }, [surface, loaded.graph, focusedEntityKey, entities, entityDossier]);

  async function fetchReviewQueueDetail(id: string) {
    setReviewQueueDetail(await api.reviewQueueDetail(id));
  }

  async function refreshAfterMutation() {
    await Promise.all([
      fetchOverview(true),
      loaded.events ? fetchEvents(true) : Promise.resolve(),
      loaded.graph ? fetchGraph(true) : Promise.resolve(),
      loaded.briefings ? fetchBriefings(true) : Promise.resolve(),
      loaded.marketSignals ? fetchMarketSignals(true) : Promise.resolve(),
      loaded.operator ? fetchOperator(true) : Promise.resolve()
    ]);

    if (loaded.graph && focusedEntityKey) {
      await fetchEntityDossier(focusedEntityKey, true);
    }

    if (selectedQueueId) {
      await fetchReviewQueueDetail(selectedQueueId);
    }
  }

  async function handleApprove(id: string) {
    await api.approveQueueItem(id);
    await refreshAfterMutation();
  }

  async function handleReject(id: string) {
    await api.rejectQueueItem(id);
    await refreshAfterMutation();
  }

  async function handleRunIngest() {
    await api.runIngest();
    await Promise.all([
      fetchOverview(true),
      fetchEvents(true),
      fetchBriefings(true),
      fetchMarketSignals(true),
      fetchOperator(true)
    ]);
    if (loaded.graph && focusedEntityKey) {
      await fetchEntityDossier(focusedEntityKey, true);
    }
  }

  async function handlePublishTopLineMetric(key: string, payload: OperatorMetricPublishInput) {
    setPublishingMetricKey(key);
    try {
      await api.publishTopLineMetric(key, payload);
      await Promise.all([
        fetchOverview(true),
        fetchBriefings(true),
        fetchMarketSignals(true),
        fetchOperator(true)
      ]);
      if (loaded.graph && focusedEntityKey) {
        await fetchEntityDossier(focusedEntityKey, true);
      }
    } finally {
      setPublishingMetricKey(null);
    }
  }

  function handleOpenSourceFocus(slug: string) {
    setFocusedSourceSlug(slug);
    void ensureSurfaceData("signals");
    startTransition(() => setSurface("signals"));
  }

  async function handleOpenEventById(eventId: string) {
    const matchedEvent = events.find((event) => event.id === eventId) ?? (focusedEvent?.id === eventId ? focusedEvent : null) ?? await api.event(eventId);
    setSearch("");
    setFocusedEventId(matchedEvent.id);
    setFocusedEvent(matchedEvent);
    void ensureSurfaceData("timeline");
    startTransition(() => setSurface("timeline"));
  }

  async function handleOpenEventReference(reference: string) {
    const nextEvents = loaded.events ? events : await api.events();
    if (!loaded.events) {
      setEvents(nextEvents);
      markLoaded({ events: true });
    }

    const matchedEvent = findEventByReference(nextEvents, reference);
    setSearch("");
    setFocusedEventId(matchedEvent?.id ?? null);
    setFocusedEvent(matchedEvent ?? null);
    void ensureSurfaceData("timeline");
    startTransition(() => setSurface("timeline"));
  }

  async function handleOpenEntity(key: string) {
    setFocusedEntityKey(key);
    await fetchGraph();
    await fetchEntityDossier(key, true);
    startTransition(() => setSurface("dossiers"));
  }

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (!deferredSearch.trim()) {
          return true;
        }

        const haystack = `${event.title} ${event.detail} ${event.sourceText} ${event.category}`.toLowerCase();
        return haystack.includes(deferredSearch.toLowerCase());
      }),
    [events, deferredSearch]
  );

  const frontStories = useMemo(
    () => stories.filter((story) => story.section === "front"),
    [stories]
  );
  const indicatorStories = useMemo(
    () => stories.filter((story) => story.section === "indicator"),
    [stories]
  );
  const achievementStories = useMemo(
    () => stories.filter((story) => story.section === "achievement"),
    [stories]
  );

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
                  <span className="text-white">{headerValue(overview?.currentDay)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Legacy as of</span>
                  <span className="text-white">{headerValue(overview?.legacyAsOf)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pending queue</span>
                  <span className="text-white">{headerValue(overview?.queue.pending)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last ingest</span>
                  <span className="text-white">{headerValue(overview?.queue.lastIngestionStatus)}</span>
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
                  className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition ${
                    surface === item.id
                      ? "border-signal/30 bg-signal/12 text-signal"
                      : "border-white/10 bg-white/[0.03] text-calm/72 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="mt-6 flex-1 space-y-6 pb-10">
          {surface === "preview" && (
            <PreviewSurface
              overview={overview}
              frontStories={frontStories}
              achievementStories={achievementStories}
              briefings={briefings}
              marketSignals={marketSignals}
              graph={{ entities, claims, relationships }}
              onOpenEntity={handleOpenEntity}
            />
          )}

          {surface === "command" && (
            <Suspense
              fallback={
                <LoadPanel
                  eyebrow="Command surface"
                  title="Loading shell"
                  detail="Heavy geospatial and charting layers are deferred so the shell can paint first and the bundle can split cleanly."
                />
              }
            >
              <CommandSurface
                overview={overview}
                frontStories={frontStories}
                achievementStories={achievementStories}
                entities={entities}
                mapLayers={mapLayers}
                history={history}
                onOpenEntity={handleOpenEntity}
              />
            </Suspense>
          )}

          {surface === "timeline" && (
            <TimelineSurface
              events={filteredEvents}
              entities={entities}
              sources={sources}
              search={search}
              onSearch={setSearch}
              focusedEventId={focusedEventId}
              focusedEvent={focusedEvent}
              onOpenSource={handleOpenSourceFocus}
              onOpenEntity={handleOpenEntity}
            />
          )}

          {surface === "dossiers" && (
            <Suspense
              fallback={
                <LoadPanel
                  eyebrow="Dossiers surface"
                  title="Loading actor graph"
                  detail="Canonical actor and claim dossiers are split into their own lane so the graph can deepen without bloating the first paint."
                />
              }
            >
              <DossiersSurface
                graph={{ entities, claims, relationships }}
                dossier={entityDossier}
                onSelectEntity={(key) => {
                  setFocusedEntityKey(key);
                  void fetchEntityDossier(key, true);
                }}
                onOpenEvent={handleOpenEventById}
              />
            </Suspense>
          )}

          {surface === "signals" && (
            <SignalsSurface
              indicators={indicatorStories}
              stories={stories}
              entities={entities}
              sources={sources}
              marketSignals={marketSignals}
              focusedSourceSlug={focusedSourceSlug}
              onFocusSource={setFocusedSourceSlug}
              onOpenEntity={handleOpenEntity}
            />
          )}

          {surface === "briefings" && (
            <BriefingsSurface
              briefings={briefings}
              events={events}
              entities={entities}
              onOpenEvent={handleOpenEventReference}
              onOpenEntity={handleOpenEntity}
            />
          )}

          {surface === "operator" && (
            <Suspense
              fallback={
                <LoadPanel
                  eyebrow="Operator surface"
                  title="Loading review controls"
                  detail="Operator workflows are split off the public command center and load only when the operator lane is opened."
                />
              }
            >
              <OperatorSurface
                queue={reviewQueue}
                queueSummary={reviewQueueSummary}
                runs={ingestionRuns}
              topLineMetrics={topLineMetrics}
              topLineSuggestions={topLineSuggestions}
              selectedQueueId={selectedQueueId}
              reviewQueueDetail={reviewQueueDetail}
              onApprove={handleApprove}
              onReject={handleReject}
              onIngest={handleRunIngest}
              onSelectQueueItem={setSelectedQueueId}
              onOpenEvent={handleOpenEventById}
              onPublishMetric={handlePublishTopLineMetric}
              publishingMetricKey={publishingMetricKey}
              operatorError={operatorError}
              />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
