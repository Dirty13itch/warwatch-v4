import type { EventRecord } from "@shared/types";
import { formatDate, formatTokenLabel } from "../lib/format";

function significanceBadge(significance: EventRecord["significance"]): string {
  if (significance === "critical") {
    return "border-hostile/24 bg-hostile/12 text-hostile";
  }
  if (significance === "high") {
    return "border-warning/24 bg-warning/10 text-warning";
  }

  return "border-white/10 text-calm/70";
}

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
          ? "subtle-card subtle-card-strong border-signal/24 shadow-[0_0_0_1px_rgba(89,211,255,0.08)]"
          : "subtle-card hover:border-white/12 hover:bg-white/[0.04]"
      }`}
    >
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-calm/72">
        <p>{formatDate(event.date)}</p>
        <p className="mt-2 text-signal/80">{formatTokenLabel(event.category)}</p>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <span className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] ${significanceBadge(event.significance)}`}>
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
