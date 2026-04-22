import { useEffect, useState } from "react";
import type { BriefingRecord, EventRecord } from "@shared/types";
import { formatDate, formatDateTime } from "../lib/format";
import { findEventByReference } from "../lib/canonical-linking";

type BriefingSection = {
  heading: string | null;
  lines: string[];
};

function isSectionHeading(line: string): boolean {
  const candidate = line.replace(/:$/, "");
  return candidate.length <= 40 && /^[A-Z][A-Z /&-]+$/.test(candidate);
}

function briefingSections(body: string): BriefingSection[] {
  const sections: BriefingSection[] = [];
  let current: BriefingSection = { heading: null, lines: [] };

  for (const rawLine of body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^sources:/i.test(line))) {
    if (isSectionHeading(rawLine)) {
      if (current.heading || current.lines.length) {
        sections.push(current);
      }
      current = { heading: rawLine.replace(/:$/, ""), lines: [] };
      continue;
    }

    current.lines.push(rawLine.replace(/^- /, ""));
  }

  if (current.heading || current.lines.length) {
    sections.push(current);
  }

  return sections.filter((section) => section.heading || section.lines.length);
}

function briefingHighlights(body: string): BriefingSection[] {
  return briefingSections(body)
    .filter((section) => section.lines.length)
    .slice(0, 4);
}

export default function BriefingsSurface({
  briefings,
  events,
  onOpenEvent
}: {
  briefings: BriefingRecord[];
  events: EventRecord[];
  onOpenEvent?: (reference: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(briefings[0]?.id ?? null);
  const selectedBriefing = briefings.find((briefing) => briefing.id === selectedId) ?? briefings[0] ?? null;

  useEffect(() => {
    if (!selectedBriefing) {
      setSelectedId(null);
      return;
    }

    if (selectedBriefing.id !== selectedId) {
      setSelectedId(selectedBriefing.id);
    }
  }, [selectedBriefing, selectedId]);

  return (
    <div
      className="grid gap-5 xl:grid-cols-[0.76fr_1.24fr]"
      data-preview="briefings-surface"
    >
      <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
              Briefing archive
            </p>
            <h2 className="font-display text-2xl text-white">Published SITREPs and archive state</h2>
          </div>
          <p className="max-w-[16rem] text-sm leading-6 text-calm/78">
            Archive selection now opens the reader instead of dumping every full briefing inline.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {briefings.map((briefing) => {
            const highlight = briefingHighlights(briefing.body)[0];
            return (
              <button
                key={briefing.id}
                type="button"
                onClick={() => setSelectedId(briefing.id)}
                className={`w-full rounded-[22px] border p-4 text-left transition ${
                  selectedBriefing?.id === briefing.id
                    ? "border-signal/22 bg-signal/8"
                    : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/78">
                      {briefing.title}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{formatDate(briefing.briefingDate)}</h3>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/60">
                    {briefing.reviewState} / {briefing.publishState}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-calm/82">
                  {highlight
                    ? `${highlight.heading ? `${highlight.heading}: ` : ""}${highlight.lines[0]}`
                    : "No summary line available."}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
        {selectedBriefing ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
                  Reader
                </p>
                <h2 className="mt-2 font-display text-3xl text-white">{selectedBriefing.title}</h2>
                <p className="mt-2 text-sm text-calm/68">
                  {formatDate(selectedBriefing.briefingDate)}
                </p>
              </div>
              <div className="grid gap-2 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">
                  {selectedBriefing.reviewState} / {selectedBriefing.publishState}
                </p>
                <p className="text-sm text-calm/76">
                  Published {formatDateTime(selectedBriefing.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {briefingHighlights(selectedBriefing.body).map((section, index) => (
                <div
                  key={`${selectedBriefing.id}-highlight-${index}`}
                  className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4"
                >
                  {section.heading ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                      {section.heading}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm leading-6 text-calm/82">{section.lines.join(" ")}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-[#08111b]/90 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/78">
                Full briefing
              </p>
              <div className="mt-4 space-y-4">
                {briefingSections(selectedBriefing.body).map((section, index) => (
                  <div
                    key={`${selectedBriefing.id}-section-${index}`}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4"
                  >
                    {section.heading ? (
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                        {section.heading}
                      </p>
                    ) : null}
                    <div className="mt-2 space-y-3">
                      {section.lines.map((line, lineIndex) => (
                        <p
                          key={`${selectedBriefing.id}-section-${index}-line-${lineIndex}`}
                          className="text-sm leading-7 text-calm/84"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/78">
                Source references
              </p>
              <p className="mt-3 text-sm leading-6 text-calm/72">
                Canonical matches can jump directly into the timeline reader. Unmatched refs stay as raw citation chips.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedBriefing.sourceRefs.length ? (
                  selectedBriefing.sourceRefs.map((ref) =>
                    findEventByReference(events, ref) ? (
                      <button
                        key={ref}
                        type="button"
                        onClick={() => onOpenEvent?.(ref)}
                        className="rounded-full border border-signal/18 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                      >
                        {ref}
                      </button>
                    ) : (
                      <span
                        key={ref}
                        className="rounded-full border border-white/8 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/68"
                      >
                        {ref}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-sm text-calm/70">No structured source references were attached.</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-6 text-calm/76">
            No published briefings are available yet.
          </div>
        )}
      </section>
    </div>
  );
}
