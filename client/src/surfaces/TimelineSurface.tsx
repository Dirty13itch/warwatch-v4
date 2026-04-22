import { useEffect, useMemo, useState } from "react";
import type { Confidence, EntityRecord, EventRecord, Significance, SourceRecord } from "@shared/types";
import { EventRow } from "../components/EventRow";
import { formatDate, formatDateTime, formatTokenLabel } from "../lib/format";
import { findEntitiesByText, findSourceByText } from "../lib/canonical-linking";

const confidenceFilters: Array<Confidence | "all"> = [
  "all",
  "confirmed",
  "reported",
  "claimed",
  "disputed",
  "unverified",
  "auto_extracted"
];

const significanceFilters: Array<Significance | "all"> = ["all", "critical", "high", "medium", "watch"];

function detailLines(event: EventRecord): string[] {
  return event.detail
    .split(/[.;]\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function publicationLabel(event: EventRecord): string {
  if (event.reviewState === "approved" || event.reviewState === "auto_published") {
    return event.visibility === "primary" ? "primary public" : "secondary public";
  }

  return "review gated";
}

export default function TimelineSurface({
  events,
  entities,
  sources,
  search,
  onSearch,
  focusedEventId,
  focusedEvent,
  onOpenSource,
  onOpenEntity
}: {
  events: EventRecord[];
  entities: EntityRecord[];
  sources: SourceRecord[];
  search: string;
  onSearch: (value: string) => void;
  focusedEventId?: string | null;
  focusedEvent?: EventRecord | null;
  onOpenSource?: (slug: string) => void;
  onOpenEntity?: (key: string) => void;
}) {
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(events.map((event) => event.category))).sort()],
    [events]
  );
  const [category, setCategory] = useState<string>("all");
  const [confidence, setConfidence] = useState<Confidence | "all">("all");
  const [significance, setSignificance] = useState<Significance | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(focusedEventId ?? null);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (category !== "all" && event.category !== category) {
          return false;
        }
        if (confidence !== "all" && event.confidence !== confidence) {
          return false;
        }
        if (significance !== "all" && event.significance !== significance) {
          return false;
        }
        return true;
      }),
    [events, category, confidence, significance]
  );

  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedId) ??
    events.find((event) => event.id === selectedId) ??
    (focusedEvent?.id === selectedId ? focusedEvent : null) ??
    filteredEvents[0] ??
    null;

  const matchedSource = selectedEvent ? findSourceByText(sources, selectedEvent.sourceText) : null;
  const matchedEntities = selectedEvent
    ? findEntitiesByText(entities, selectedEvent.title, selectedEvent.detail, selectedEvent.sourceText)
    : [];

  useEffect(() => {
    if (focusedEventId) {
      setCategory("all");
      setConfidence("all");
      setSignificance("all");
      setSelectedId(focusedEventId);
    }
  }, [focusedEventId]);

  useEffect(() => {
    if (!selectedEvent) {
      setSelectedId(null);
      return;
    }

    if (selectedEvent.id !== selectedId) {
      setSelectedId(selectedEvent.id);
    }
  }, [selectedEvent, selectedId]);

  const totalCorroboration = filteredEvents.reduce((sum, event) => sum + event.corroboration, 0);
  const criticalCount = filteredEvents.filter((event) => event.significance === "critical").length;
  const reviewGatedCount = filteredEvents.filter((event) => event.visibility === "review_only").length;

  return (
    <section
      className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell"
      data-preview="timeline-surface"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
            Timeline
          </p>
          <h2 className="font-display text-2xl text-white">Chronology explorer with review and corroboration context</h2>
        </div>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search events, sources, categories"
          className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-calm/40 md:max-w-sm"
        />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        {[
          ["Visible events", String(filteredEvents.length)],
          ["Critical", String(criticalCount)],
          ["Review gated", String(reviewGatedCount)],
          ["Corroboration refs", String(totalCorroboration)]
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">{label}</p>
            <p className="mt-2 font-display text-2xl text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] ${
                category === item
                  ? "border-signal/24 bg-signal/12 text-signal"
                  : "border-white/8 bg-white/[0.03] text-calm/70"
              }`}
            >
              {item === "all" ? "All categories" : formatTokenLabel(item)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {significanceFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSignificance(item)}
              className={`rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] ${
                significance === item
                  ? "border-warning/24 bg-warning/10 text-warning"
                  : "border-white/8 bg-white/[0.03] text-calm/70"
              }`}
            >
              {item === "all" ? "All significance" : item}
            </button>
          ))}
          {confidenceFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setConfidence(item)}
              className={`rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] ${
                confidence === item
                  ? "border-signal/24 bg-signal/12 text-signal"
                  : "border-white/8 bg-white/[0.03] text-calm/70"
              }`}
            >
              {item === "all" ? "All confidence" : item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {filteredEvents.length ? (
            filteredEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                selected={selectedEvent?.id === event.id}
                onSelect={(next) => setSelectedId(next.id)}
              />
            ))
          ) : (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-6 text-calm/78">
              No events match the current search and filter state.
            </div>
          )}
        </div>

        <aside
          className="rounded-[26px] border border-line/80 bg-[#08111b]/90 p-5 shadow-shell"
          data-preview="timeline-detail"
        >
          {selectedEvent ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/72">
                    Event detail
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{selectedEvent.title}</h3>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">Public posture</p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white">
                    {publicationLabel(selectedEvent)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Date", formatDate(selectedEvent.date)],
                  ["Category", formatTokenLabel(selectedEvent.category)],
                  ["Significance", selectedEvent.significance],
                  ["Confidence", selectedEvent.confidence],
                  ["Corroboration", `${selectedEvent.corroboration} refs`],
                  ["Review state", selectedEvent.reviewState]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">What happened</p>
                <div className="mt-3 space-y-3">
                  {detailLines(selectedEvent).map((line) => (
                    <p
                      key={line}
                      className="text-sm leading-6 text-calm/84"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">Source text</p>
                  <p className="mt-3 text-sm leading-6 text-calm/82">{selectedEvent.sourceText}</p>
                  {matchedSource ? (
                    <button
                      type="button"
                      onClick={() => onOpenSource?.(matchedSource.slug)}
                      className="mt-4 rounded-full border border-signal/20 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                    >
                      Open source posture
                    </button>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedEvent.sourceRefs.map((ref) => (
                      <span
                        key={ref}
                        className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/68"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">Actor threads and ingest timing</p>
                  {matchedEntities.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {matchedEntities.map((entity) => (
                        <button
                          key={entity.id}
                          type="button"
                          onClick={() => onOpenEntity?.(entity.slug)}
                          className="rounded-full border border-signal/18 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                        >
                          {entity.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-calm/74">
                      No canonical actor matches were derived from this event yet.
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedEvent.tags.length ? (
                      selectedEvent.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-signal/16 bg-signal/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-signal/82"
                        >
                          {formatTokenLabel(tag)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-calm/68">No structured tags</span>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-calm/78">
                    Ingested {formatDateTime(selectedEvent.createdAt)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-calm/78">
                    Visibility is currently <span className="font-semibold text-white">{selectedEvent.visibility}</span>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-6 text-calm/78">
              Select an event to inspect its public posture, corroboration, and source context.
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
