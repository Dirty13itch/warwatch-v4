import type { EventRecord } from "@shared/types";
import { formatDate, formatTokenLabel } from "../lib/format";

export function EventRow({
  event,
  selected = false,
  onSelect
}: {
  event: EventRecord;
  selected?: boolean;
  onSelect?: (event: EventRecord) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(event)}
      className={`grid w-full gap-3 rounded-[22px] border px-4 py-4 text-left transition md:grid-cols-[8rem_1fr] ${
        selected
          ? "border-signal/24 bg-signal/8 shadow-[0_0_0_1px_rgba(89,211,255,0.08)]"
          : "border-white/6 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.035]"
      }`}
    >
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-calm/72">
        <p>{formatDate(event.date)}</p>
        <p className="mt-2 text-signal/80">{formatTokenLabel(event.category)}</p>
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
          <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-calm/60">
            {event.corroboration} refs
          </span>
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-calm/82">{event.detail}</p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-calm/60">
          {event.sourceText}
        </p>
      </div>
    </button>
  );
}
