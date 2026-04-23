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
  OperatorSynthesisSnapshot,
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
  { id: "preview", label: "Home" },
  { id: "command", label: "Command" },
  { id: "timeline", label: "Timeline" },
  { id: "dossiers", label: "Dossiers" },
  { id: "signals", label: "Signals" },
  { id: "briefings", label: "Briefings" },
  { id: "operator", label: "Operator" }
] as const;

type SurfaceId = (typeof surfaces)[number]["id"];
type RouteState = {
  surface: SurfaceId;
  entityKey: string | null;
  sourceSlug: string | null;
  eventId: string | null;
};

const surfacePathMap: Record<SurfaceId, string> = {
  preview: "/",
  command: "/command",
  timeline: "/timeline",
  dossiers: "/dossiers",
  signals: "/signals",
  briefings: "/briefings",
  operator: "/operator"
};

const pathSurfaceMap = new Map<string, SurfaceId>(
  Object.entries(surfacePathMap).map(([surface, pathname]) => [pathname, surface as SurfaceId])
);

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

function defaultRouteState(): RouteState {
  return {
    surface: "preview",
    entityKey: null,
    sourceSlug: null,
    eventId: null
  };
}

function readRouteState(): RouteState {
  if (typeof window === "undefined") {
    return defaultRouteState();
  }

  const url = new URL(window.location.href);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  return {
    surface: pathSurfaceMap.get(pathname) ?? "preview",
    entityKey: url.searchParams.get("entity"),
    sourceSlug: url.searchParams.get("source"),
    eventId: url.searchParams.get("event")
  };
}

function writeRouteState(next: RouteState) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.pathname = surfacePathMap[next.surface];
  url.search = "";
  if (next.entityKey) {
    url.searchParams.set("entity", next.entityKey);
  }
  if (next.sourceSlug) {
    url.searchParams.set("source", next.sourceSlug);
  }
  if (next.eventId) {
    url.searchParams.set("event", next.eventId);
  }

  const current = `${window.location.pathname}${window.location.search}`;
  const candidate = `${url.pathname}${url.search}`;
  if (candidate !== current) {
    window.history.pushState({}, "", candidate);
  }
}

function headerValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "...";
  }

  return String(value);
}

export default function App() {
  const initialRoute = readRouteState();
  const [surface, setSurface] = useState<SurfaceId>(initialRoute.surface);
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
  const [synthesis, setSynthesis] = useState<OperatorSynthesisSnapshot>({ stories: [], claims: [] });
  const [search, setSearch] = useState("");
  const [focusedEventId, setFocusedEventId] = useState<string | null>(initialRoute.eventId);
  const [focusedEvent, setFocusedEvent] = useState<EventRecord | null>(null);
  const [focusedEntityKey, setFocusedEntityKey] = useState<string | null>(initialRoute.entityKey);
  const [focusedSourceSlug, setFocusedSourceSlug] = useState<string | null>(initialRoute.sourceSlug);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [reviewQueueDetail, setReviewQueueDetail] = useState<ReviewQueueDetail | null>(null);
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [publishingMetricKey, setPublishingMetricKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<LoadedState>(initialLoadedState);
  const loadingRef = useRef(new Set<string>());
  const deferredSearch = useDeferredValue(search);

  function handleOpenSurface(target: SurfaceId) {
    setFocusedEventId(null);
    setFocusedEvent(null);
    setFocusedSourceSlug(null);
    const nextEntityKey = target === "dossiers" ? focusedEntityKey : null;
    if (target !== "dossiers") {
      setFocusedEntityKey(null);
    }
    writeRouteState({
      surface: target,
      entityKey: nextEntityKey,
      sourceSlug: null,
      eventId: null
    });
    void ensureSurfaceData(target);
    startTransition(() => setSurface(target));
  }

  function markLoaded(next: Partial<LoadedState>) {
    setLoaded((current) => ({ ...current, ...next }));
  }

  function syncDocumentMeta() {
    if (typeof document === "undefined") {
      return;
    }

    const titleBase =
      surface === "preview"
        ? "WarWatch | Public briefing website for the Iran conflict"
        : `${surfaces.find((item) => item.id === surface)?.label ?? "WarWatch"} | WarWatch`;
    const description =
      surface === "preview"
        ? overview?.headline.description ??
          "Public briefing website for the Iran conflict with review-gated claims, daily SITREPs, dossiers, timeline context, and signals."
        : surface === "briefings"
          ? "Daily SITREPs and briefing archive with operator-reviewed public context."
          : surface === "timeline"
            ? "Filterable public timeline with corroboration, significance, and source-linked context."
            : surface === "dossiers"
              ? entityDossier
                ? `${entityDossier.entity.name} dossier with linked claims, stories, events, and briefings.`
                : "Canonical actor dossiers and claim graph for the public WarWatch site."
              : surface === "signals"
                ? "Live market pressure, source posture, and signals shaping the public conflict picture."
                : surface === "command"
                  ? "Operational command surface over the public WarWatch runtime."
                  : "Operator review controls, synthesis lane, and ingestion oversight.";

    const setMeta = (selector: string, attribute: string, value: string) => {
      const element = document.head.querySelector(selector);
      if (element) {
        element.setAttribute(attribute, value);
      }
    };

    const canonicalHref = typeof window !== "undefined" ? window.location.href : "";

    document.title = titleBase;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", titleBase);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", canonicalHref);
    setMeta('meta[name="twitter:title"]', "content", titleBase);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:url"]', "content", canonicalHref);

    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", canonicalHref);
    }
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

  async function fetchOperator(force = false, preferredQueueId: string | null = selectedQueueId) {
    if (!force && (loaded.operator || loadingRef.current.has("operator"))) {
      return;
    }

    loadingRef.current.add("operator");
    try {
      const [queue, summary, runs, metrics, suggestions, synthesisSnapshot] = await Promise.all([
        api.reviewQueue(),
        api.reviewQueueSummary(),
        api.ingestionRuns(),
        api.topLineMetrics(),
        api.topLineSuggestions(),
        api.synthesis()
      ]);
      setReviewQueue(queue);
      setReviewQueueSummary(summary);
      setIngestionRuns(runs);
      setTopLineMetrics(metrics);
      setTopLineSuggestions(suggestions);
      setSynthesis(synthesisSnapshot);
      if (queue.length) {
        const targetQueueId =
          preferredQueueId && queue.some((item) => item.id === preferredQueueId)
            ? preferredQueueId
            : queue[0].id;
        if (targetQueueId !== selectedQueueId) {
          setSelectedQueueId(targetQueueId);
        }
      } else {
        setSelectedQueueId(null);
        setReviewQueueDetail(null);
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
    if (typeof window === "undefined") {
      return;
    }

    const onPopState = () => {
      const next = readRouteState();
      setSurface(next.surface);
      setFocusedEntityKey(next.entityKey);
      setFocusedSourceSlug(next.sourceSlug);
      setFocusedEventId(next.eventId);
      if (!next.eventId) {
        setFocusedEvent(null);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    void ensureSurfaceData(surface);
  }, [surface]);

  useEffect(() => {
    if (surface !== "timeline" || !focusedEventId) {
      return;
    }

    if (focusedEvent?.id === focusedEventId) {
      return;
    }

    const existing = events.find((event) => event.id === focusedEventId);
    if (existing) {
      setFocusedEvent(existing);
      return;
    }

    void api
      .event(focusedEventId)
      .then((event) => setFocusedEvent(event))
      .catch(() => setFocusedEvent(null));
  }, [surface, focusedEventId, focusedEvent?.id, events]);

  useEffect(() => {
    syncDocumentMeta();
  }, [surface, overview, entityDossier, focusedEvent?.id]);

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

  async function refreshAfterMutation(targetQueueId: string | null = selectedQueueId) {
    await Promise.all([
      fetchOverview(true),
      loaded.events ? fetchEvents(true) : Promise.resolve(),
      loaded.graph ? fetchGraph(true) : Promise.resolve(),
      loaded.briefings ? fetchBriefings(true) : Promise.resolve(),
      loaded.marketSignals ? fetchMarketSignals(true) : Promise.resolve(),
      loaded.operator ? fetchOperator(true, targetQueueId) : Promise.resolve()
    ]);

    if (loaded.graph && focusedEntityKey) {
      await fetchEntityDossier(focusedEntityKey, true);
    }

    if (targetQueueId) {
      setSelectedQueueId(targetQueueId);
      await fetchReviewQueueDetail(targetQueueId);
    } else {
      setReviewQueueDetail(null);
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

  async function handleQueueStorySuggestion(id: string) {
    const queued = await api.queueStorySuggestion(id);
    await refreshAfterMutation(queued.id);
  }

  async function handleQueueClaimSuggestion(id: string) {
    const queued = await api.queueClaimSuggestion(id);
    await refreshAfterMutation(queued.id);
  }

  async function handleOpenQueuedReview(id: string) {
    setSelectedQueueId(id);
    await fetchReviewQueueDetail(id);
  }

  async function handleRunIngest() {
    await api.runIngest();
    await Promise.all([
      fetchOverview(true),
      fetchEvents(true),
      fetchBriefings(true),
      fetchMarketSignals(true),
      fetchOperator(true, selectedQueueId)
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
    setFocusedEntityKey(null);
    setFocusedEventId(null);
    setFocusedEvent(null);
    writeRouteState({
      surface: "signals",
      entityKey: null,
      sourceSlug: slug,
      eventId: null
    });
    void ensureSurfaceData("signals");
    startTransition(() => setSurface("signals"));
  }

  async function handleOpenEventById(eventId: string) {
    const matchedEvent = events.find((event) => event.id === eventId) ?? (focusedEvent?.id === eventId ? focusedEvent : null) ?? await api.event(eventId);
    setSearch("");
    setFocusedEventId(matchedEvent.id);
    setFocusedEvent(matchedEvent);
    setFocusedEntityKey(null);
    setFocusedSourceSlug(null);
    writeRouteState({
      surface: "timeline",
      entityKey: null,
      sourceSlug: null,
      eventId: matchedEvent.id
    });
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
    setFocusedEntityKey(null);
    setFocusedSourceSlug(null);
    writeRouteState({
      surface: "timeline",
      entityKey: null,
      sourceSlug: null,
      eventId: matchedEvent?.id ?? null
    });
    void ensureSurfaceData("timeline");
    startTransition(() => setSurface("timeline"));
  }

  async function handleOpenEntity(key: string) {
    setFocusedEntityKey(key);
    setFocusedSourceSlug(null);
    setFocusedEventId(null);
    setFocusedEvent(null);
    await fetchGraph();
    await fetchEntityDossier(key, true);
    writeRouteState({
      surface: "dossiers",
      entityKey: key,
      sourceSlug: null,
      eventId: null
    });
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
      <a href="#main-content" className="skip-link">Skip To Main Content</a>
      <div className="mx-auto flex min-h-screen max-w-[90rem] flex-col px-3 py-3 sm:px-6 lg:px-8">
        <header className="shell-panel relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
          <div className="absolute inset-0 opacity-55">
            <div className="absolute -left-12 top-2 h-28 w-28 rounded-full bg-signal/14 blur-3xl" />
            <div className="absolute right-4 top-4 h-32 w-32 rounded-full bg-ember/10 blur-3xl" />
            <div className="grid-radar absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(89,211,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <p className="eyebrow-label">WarWatch V4</p>
                <h1 className="mt-2 font-display text-[clamp(1.8rem,5vw,3.4rem)] leading-[0.9] text-white">
                  Public briefing website over a review-gated intelligence spine.
                </h1>
                <p className="mt-3 max-w-[40rem] text-sm leading-6 text-calm/80 sm:text-[0.95rem] sm:leading-7">
                  Timeline, dossiers, signals, daily briefings, and operator review all resolve against the same canonical runtime instead of a static dashboard.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[34rem] xl:grid-cols-4">
                {[
                  ["Current day", headerValue(overview?.currentDay)],
                  ["Top-line", headerValue(overview?.freshness.topLine)],
                  ["Pending queue", headerValue(overview?.queue.pending)],
                  ["Last ingest", headerValue(overview?.queue.lastIngestionStatus)]
                ].map(([label, value]) => (
                  <div key={label} className="shell-panel-elevated px-3 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/60">{label}</p>
                    <p className="mt-2 font-display text-[1.3rem] leading-none text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <nav
              aria-label="Primary surfaces"
              className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mt-1 md:flex-wrap md:overflow-visible"
            >
              {surfaces.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={surface === item.id}
                  onClick={() => {
                    handleOpenSurface(item.id);
                  }}
                  className={`interactive-pill shrink-0 ${
                    surface === item.id
                      ? "interactive-pill--active"
                      : "interactive-pill--idle"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main id="main-content" className="mt-6 flex-1 space-y-8 pb-10">
          {surface === "preview" && (
            <PreviewSurface
              overview={overview}
              frontStories={frontStories}
              achievementStories={achievementStories}
              briefings={briefings}
              marketSignals={marketSignals}
              graph={{ entities, claims, relationships }}
              onOpenEntity={handleOpenEntity}
              onOpenSurface={handleOpenSurface}
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
                  writeRouteState({
                    surface: "dossiers",
                    entityKey: key,
                    sourceSlug: null,
                    eventId: null
                  });
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
              onFocusSource={handleOpenSourceFocus}
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
                synthesis={synthesis}
                selectedQueueId={selectedQueueId}
                reviewQueueDetail={reviewQueueDetail}
                onApprove={handleApprove}
                onReject={handleReject}
                onIngest={handleRunIngest}
                onSelectQueueItem={setSelectedQueueId}
                onOpenEvent={handleOpenEventById}
                onOpenEntity={handleOpenEntity}
                onQueueStorySuggestion={handleQueueStorySuggestion}
                onQueueClaimSuggestion={handleQueueClaimSuggestion}
                onOpenQueuedReview={handleOpenQueuedReview}
                onPublishMetric={handlePublishTopLineMetric}
                publishingMetricKey={publishingMetricKey}
                operatorError={operatorError}
              />
            </Suspense>
          )}
        </main>

        <footer className="border-t border-white/8 pb-8 pt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_0.9fr]">
            <div className="space-y-3">
              <p className="eyebrow-label">WarWatch</p>
              <p className="max-w-[24rem] text-sm leading-6 text-calm/76">
                Public briefing website over a review-gated intelligence spine. Daily SITREPs, dossiers, timeline context, signals, and operator controls all resolve against the same runtime.
              </p>
            </div>
            <div className="space-y-3">
              <p className="eyebrow-label">Navigate</p>
              <div className="flex flex-wrap gap-2">
                {surfaces
                  .filter((item) => item.id !== "operator")
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpenSurface(item.id)}
                      className="interactive-pill interactive-pill--idle"
                    >
                      {item.label}
                    </button>
                  ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="eyebrow-label">Public status</p>
              <div className="grid gap-2 text-sm text-calm/76">
                <div className="flex items-center justify-between gap-3">
                  <span>Top-line freshness</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                    {headerValue(overview?.freshness.topLine)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Pending queue</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                    {headerValue(overview?.queue.pending)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Last ingest</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                    {headerValue(overview?.queue.lastIngestionStatus)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
