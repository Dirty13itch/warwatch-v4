import type { EventRecord } from "@shared/types";
import { EventRow } from "../components/EventRow";

export default function TimelineSurface({
  events,
  search,
  onSearch
}: {
  events: EventRecord[];
  search: string;
  onSearch: (value: string) => void;
}) {
  return (
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
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search events, sources, categories"
          className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-calm/40 md:max-w-sm"
        />
      </div>
      <div className="mt-6">
        {events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
          />
        ))}
      </div>
    </section>
  );
}

