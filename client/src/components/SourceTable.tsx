import { useEffect, useMemo, useState } from "react";
import type { EntityRecord, SourceRecord, StoryRecord } from "@shared/types";
import { formatTokenLabel } from "../lib/format";
import { findEntitiesByText, relatedStoriesForSource } from "../lib/canonical-linking";

function reliabilityLabel(score: number): string {
  if (score >= 0.85) {
    return "high confidence";
  }
  if (score >= 0.7) {
    return "strong";
  }
  if (score >= 0.55) {
    return "mixed";
  }
  return "volatile";
}

export function SourceTable({
  sources,
  stories,
  entities,
  focusedSourceSlug,
  onFocusSource,
  onOpenEntity
}: {
  sources: SourceRecord[];
  stories: StoryRecord[];
  entities: EntityRecord[];
  focusedSourceSlug?: string | null;
  onFocusSource?: (slug: string) => void;
  onOpenEntity?: (key: string) => void;
}) {
  const preferredSourceSlug = useMemo(() => {
    if (focusedSourceSlug) {
      return focusedSourceSlug;
    }

    const ranked = sources
      .map((source) => {
        const sourceStories = relatedStoriesForSource(stories, source);
        const actorMatches = findEntitiesByText(
          entities,
          source.name,
          source.notes,
          sourceStories.map((story) => `${story.title} ${story.summary} ${story.detail}`).join(" ")
        ).length;

        return {
          slug: source.slug,
          score: actorMatches * 5 + sourceStories.length * 2 + source.reliabilityScore
        };
      })
      .sort((left, right) => right.score - left.score);

    return ranked[0]?.slug ?? sources[0]?.slug ?? null;
  }, [entities, focusedSourceSlug, sources, stories]);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(preferredSourceSlug);

  useEffect(() => {
    if (focusedSourceSlug) {
      setSelectedSlug(focusedSourceSlug);
      return;
    }

    if (!selectedSlug || !sources.some((source) => source.slug === selectedSlug)) {
      setSelectedSlug(preferredSourceSlug);
    }
  }, [focusedSourceSlug, preferredSourceSlug, selectedSlug, sources]);

  const selectedSource = sources.find((source) => source.slug === selectedSlug) ?? sources[0] ?? null;
  const relatedStories = useMemo(
    () => relatedStoriesForSource(stories, selectedSource).slice(0, 4),
    [stories, selectedSource]
  );
  const matchedEntities = useMemo(
    () =>
      selectedSource
        ? findEntitiesByText(
            entities,
            selectedSource.name,
            selectedSource.notes,
            relatedStories.map((story) => `${story.title} ${story.summary} ${story.detail}`).join(" ")
          )
        : [],
    [entities, relatedStories, selectedSource]
  );

  return (
    <section
      className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell"
      data-preview="source-reader"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
            Source posture
          </p>
          <h2 className="font-display text-2xl text-white">Reliability ledger and source reader</h2>
        </div>
        <p className="max-w-[22rem] text-sm text-calm/78">
          Public shell now separates source weighting from event display and can hand readers into the underlying source posture.
        </p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-3">
          {sources.slice(0, 12).map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => {
                setSelectedSlug(source.slug);
                onFocusSource?.(source.slug);
              }}
              className={`w-full rounded-[20px] border p-4 text-left transition ${
                selectedSource?.id === source.id
                  ? "border-signal/22 bg-signal/8"
                  : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{source.name}</h3>
                  <p className="mt-2 text-sm text-calm/80">{formatTokenLabel(source.type)}</p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">
                  {(source.reliabilityScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                  {source.reviewState}
                </span>
                <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                  {source.biasDirection}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#08111b]/90 p-5">
          {selectedSource ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal/76">
                    Source reader
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{selectedSource.name}</h3>
                </div>
                <span className="rounded-full border border-white/8 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/66">
                  {formatTokenLabel(selectedSource.type)}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Reliability", `${(selectedSource.reliabilityScore * 100).toFixed(0)}%`],
                  ["Confidence band", reliabilityLabel(selectedSource.reliabilityScore)],
                  ["Bias", selectedSource.biasDirection]
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
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                  Assessment
                </p>
                <p className="mt-3 text-sm leading-7 text-calm/84">{selectedSource.notes}</p>
              </div>

              <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                  Related stories
                </p>
                <div className="mt-3 grid gap-3">
                  {relatedStories.length ? (
                    relatedStories.map((story) => (
                      <div
                        key={story.id}
                        className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-white">{story.title}</h4>
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/60">
                            {story.significance}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-calm/82">{story.summary}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-calm/72">
                      No canonical stories currently point directly at this source.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                  Actor threads
                </p>
                <p className="mt-3 text-sm leading-6 text-calm/74">
                  Source posture now resolves into the same canonical actor graph as timeline, stories, and briefings.
                </p>
                <div className="mt-4 grid gap-3">
                  {matchedEntities.length ? (
                    matchedEntities.map((entity) => (
                      <div
                        key={entity.id}
                        className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{entity.name}</h4>
                            <p className="mt-2 text-sm leading-6 text-calm/82">{entity.summary}</p>
                          </div>
                          <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                            {formatTokenLabel(entity.kind)}
                          </span>
                        </div>
                        {onOpenEntity ? (
                          <button
                            type="button"
                            onClick={() => onOpenEntity(entity.slug)}
                            className="mt-4 rounded-full border border-signal/18 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                          >
                            Open dossier
                          </button>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-calm/72">
                      No canonical actor matches are attached to this source posture yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-6 text-calm/76">
              No source posture records are available yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
