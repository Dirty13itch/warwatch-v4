import { useEffect, useState } from "react";
import type { StoryRecord } from "@shared/types";
import { formatTokenLabel } from "../lib/format";

function storyTone(significance: StoryRecord["significance"]): string {
  if (significance === "critical") {
    return "text-hostile";
  }
  if (significance === "high") {
    return "text-warning";
  }
  return "text-signal";
}

export function StoryStrip({
  title,
  copy,
  items
}: {
  title: string;
  copy: string;
  items: StoryRecord[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selectedStory = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    if (!selectedStory) {
      setSelectedId(null);
      return;
    }

    if (selectedStory.id !== selectedId) {
      setSelectedId(selectedStory.id);
    }
  }, [selectedId, selectedStory]);

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

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {items.slice(0, 6).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-[22px] border p-4 text-left transition ${
                selectedStory?.id === item.id
                  ? "border-signal/22 bg-signal/8"
                  : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-calm/84">{item.summary}</p>
                </div>
                <span className={`font-mono text-[10px] uppercase tracking-[0.26em] ${storyTone(item.significance)}`}>
                  {item.significance}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-calm/64">
                  {formatTokenLabel(item.section)}
                </span>
                <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-calm/64">
                  {item.reviewState}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#08111b]/90 p-5">
          {selectedStory ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal/76">
                    Story detail
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{selectedStory.title}</h3>
                </div>
                <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${storyTone(selectedStory.significance)}`}>
                  {selectedStory.significance}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Section", formatTokenLabel(selectedStory.section)],
                  ["Review state", selectedStory.reviewState],
                  ["Source", selectedStory.sourceText]
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

              <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/78">
                  Summary
                </p>
                <p className="mt-3 text-sm leading-7 text-calm/84">{selectedStory.summary}</p>
              </div>

              <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/78">
                  Detail
                </p>
                <p className="mt-3 text-sm leading-7 text-calm/84">{selectedStory.detail}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-6 text-calm/76">
              No public stories are available for this strip yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
