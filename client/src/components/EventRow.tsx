import type { EventRecord } from "@shared/types";
import { formatDate } from "../lib/format";

export function EventRow({ event }: { event: EventRecord }) {
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

