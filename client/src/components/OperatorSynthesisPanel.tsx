import type { OperatorSynthesisSnapshot } from "@shared/types";
import { formatTokenLabel } from "../lib/format";

function entityLabel(key: string): string {
  return formatTokenLabel(key.replace(/^entity:/, ""));
}

export function OperatorSynthesisPanel({
  synthesis,
  onOpenEvent,
  onOpenEntity
}: {
  synthesis: OperatorSynthesisSnapshot;
  onOpenEvent?: (eventId: string) => void;
  onOpenEntity?: (key: string) => void;
}) {
  return (
    <section
      className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell"
      data-preview="operator-synthesis"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
            Synthesis lane
          </p>
          <h2 className="font-display text-2xl text-white">Story and claim promotion candidates</h2>
        </div>
        <p className="max-w-[34rem] text-sm leading-6 text-calm/80">
          Graph-aware synthesis turns recent evidence into suggested story and claim updates before the operator has to reason from raw event rows alone.
        </p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal/72">Story candidates</h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">
              {synthesis.stories.length} queued
            </span>
          </div>
          {synthesis.stories.length ? (
            synthesis.stories.map((story) => (
              <article
                key={story.id}
                className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                      {story.status === "update_story" ? "Update story" : "New story"} | {formatTokenLabel(story.suggestedSection)}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-white">{story.title}</h4>
                  </div>
                  <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                    {story.significance}
                  </span>
                </div>
                {story.matchedStoryTitle ? (
                  <p className="mt-3 text-sm leading-6 text-signal/82">
                    Canonical match: {story.matchedStoryTitle}
                  </p>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-calm/82">{story.summary}</p>
                <p className="mt-3 text-sm leading-6 text-calm/72">{story.rationale}</p>
                {story.entityKeys.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {story.entityKeys.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onOpenEntity?.(key.replace(/^entity:/, ""))}
                        className="rounded-full border border-signal/18 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                      >
                        {entityLabel(key)}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 space-y-2">
                  {story.evidence.map((event) => (
                    <div
                      key={event.eventId}
                      className="rounded-[18px] border border-white/8 bg-[#08111b]/90 p-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{event.title}</p>
                          <p className="mt-2 text-sm leading-6 text-calm/76">{event.excerpt}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenEvent?.(event.eventId)}
                          className="rounded-full border border-signal/18 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                        >
                          Open event
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-calm/72">
              No current story candidates cleared the synthesis threshold.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal/72">Claim candidates</h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">
              {synthesis.claims.length} queued
            </span>
          </div>
          {synthesis.claims.length ? (
            synthesis.claims.map((claim) => (
              <article
                key={claim.id}
                className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                      {claim.status === "update_claim" ? "Update claim" : "New claim"} | {claim.proposedStatus}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-white">{claim.title}</h4>
                  </div>
                  <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                    {claim.confidence}
                  </span>
                </div>
                {claim.matchedClaimTitle ? (
                  <p className="mt-3 text-sm leading-6 text-signal/82">
                    Canonical match: {claim.matchedClaimTitle}
                  </p>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-calm/82">{claim.statement}</p>
                <p className="mt-3 text-sm leading-6 text-calm/72">{claim.rationale}</p>
                {claim.entityKeys.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {claim.entityKeys.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onOpenEntity?.(key.replace(/^entity:/, ""))}
                        className="rounded-full border border-signal/18 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                      >
                        {entityLabel(key)}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 space-y-2">
                  {claim.evidence.map((event) => (
                    <div
                      key={event.eventId}
                      className="rounded-[18px] border border-white/8 bg-[#08111b]/90 p-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{event.title}</p>
                          <p className="mt-2 text-sm leading-6 text-calm/76">{event.excerpt}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenEvent?.(event.eventId)}
                          className="rounded-full border border-signal/18 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                        >
                          Open event
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-calm/72">
              No current claim candidates cleared the synthesis threshold.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
