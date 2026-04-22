import type { ReviewQueueDetail } from "@shared/types";
import { formatDate, formatDateTime, formatTokenLabel } from "../lib/format";

function entityLabel(key: string): string {
  return formatTokenLabel(key.replace(/^entity:/, ""));
}

export function ReviewQueueDetailPanel({
  detail,
  onOpenEvent,
  onOpenEntity
}: {
  detail: ReviewQueueDetail | null;
  onOpenEvent?: (eventId: string) => void;
  onOpenEntity?: (key: string) => void;
}) {
  if (!detail) {
    return (
      <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
          Review dossier
        </p>
        <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-6 text-calm/76">
          Select a queue item to inspect the canonical object, related evidence, and recommended next action.
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell"
      data-preview="operator-review-detail"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
            Review dossier
          </p>
          <h2 className="mt-2 font-display text-2xl text-white">{detail.item.title}</h2>
        </div>
        <div className="grid gap-2 text-right">
          <span className="rounded-full border border-hostile/25 bg-hostile/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-hostile">
            {detail.item.severity}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">
            {formatTokenLabel(detail.item.itemType)} | {detail.item.status}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] border border-white/8 bg-[#08111b]/90 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
          Recommended action
        </p>
        <p className="mt-3 text-sm leading-7 text-calm/84">{detail.recommendedAction}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
            {detail.item.ageBucket}
          </span>
          <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
            Updated {formatDateTime(detail.item.updatedAt)}
          </span>
          {detail.feedName ? (
            <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
              {detail.feedName}
            </span>
          ) : null}
          {detail.externalLink ? (
            <a
              href={detail.externalLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-signal/18 bg-signal/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
            >
              Open source link
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {detail.storySuggestion ? (
          <article className="rounded-[22px] border border-signal/16 bg-signal/8 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
              Proposed story promotion
            </p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{detail.storySuggestion.title}</h3>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">
                  {formatTokenLabel(detail.storySuggestion.status)} | {formatTokenLabel(detail.storySuggestion.suggestedSection)} | {detail.storySuggestion.significance}
                </p>
              </div>
              {detail.storySuggestion.queueId ? (
                <span className="rounded-full border border-[#2f9d65]/25 bg-[#2f9d65]/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#7ef5b0]">
                  queued
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-7 text-calm/84">{detail.storySuggestion.summary}</p>
            <p className="mt-4 text-sm leading-7 text-calm/74">{detail.storySuggestion.detail}</p>
            <p className="mt-4 text-sm leading-7 text-calm/68">{detail.storySuggestion.rationale}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">
              Source lane: {detail.storySuggestion.sourceText}
            </p>
            {detail.storySuggestion.entityKeys.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.storySuggestion.entityKeys.map((key) => (
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
          </article>
        ) : null}

        {detail.claimSuggestion ? (
          <article className="rounded-[22px] border border-signal/16 bg-signal/8 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
              Proposed claim promotion
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">Type</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatTokenLabel(detail.claimSuggestion.status)}</p>
              </div>
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">Proposed status</p>
                <p className="mt-2 text-sm font-semibold text-white">{detail.claimSuggestion.proposedStatus}</p>
              </div>
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">Confidence</p>
                <p className="mt-2 text-sm font-semibold text-white">{detail.claimSuggestion.confidence}</p>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{detail.claimSuggestion.title}</h3>
            <p className="mt-3 text-sm leading-7 text-calm/84">{detail.claimSuggestion.statement}</p>
            <p className="mt-4 text-sm leading-7 text-calm/68">{detail.claimSuggestion.rationale}</p>
            {detail.claimSuggestion.entityKeys.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.claimSuggestion.entityKeys.map((key) => (
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
          </article>
        ) : null}

        {detail.event ? (
          <article className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
              Canonical event
            </p>
            <h3 className="mt-3 text-lg font-semibold text-white">{detail.event.title}</h3>
            <p className="mt-3 text-sm leading-7 text-calm/84">{detail.event.detail}</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">
              {formatDate(detail.event.date)} | {detail.event.sourceText} | {detail.event.reviewState}
            </p>
          </article>
        ) : null}

        {detail.claim ? (
          <article className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
              Canonical claim
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">Status</p>
                <p className="mt-2 text-sm font-semibold text-white">{detail.claim.status}</p>
              </div>
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">Review state</p>
                <p className="mt-2 text-sm font-semibold text-white">{detail.claim.reviewState}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-calm/84">{detail.claim.statement}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.claim.evidenceRefs.map((ref) => (
                <span
                  key={ref}
                  className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64"
                >
                  {ref}
                </span>
              ))}
            </div>
          </article>
        ) : null}

        {detail.story ? (
          <article className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
              Canonical story
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">Section</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatTokenLabel(detail.story.section)}</p>
              </div>
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">Significance</p>
                <p className="mt-2 text-sm font-semibold text-white">{detail.story.significance}</p>
              </div>
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">Review state</p>
                <p className="mt-2 text-sm font-semibold text-white">{detail.story.reviewState}</p>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{detail.story.title}</h3>
            <p className="mt-3 text-sm leading-7 text-calm/84">{detail.story.summary}</p>
            <p className="mt-4 text-sm leading-7 text-calm/74">{detail.story.detail}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">
              Source lane: {detail.story.sourceText}
            </p>
          </article>
        ) : null}

        {detail.briefing ? (
          <article className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
              Canonical briefing
            </p>
            <h3 className="mt-3 text-lg font-semibold text-white">{detail.briefing.title}</h3>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">
              {formatDate(detail.briefing.briefingDate)} | {detail.briefing.reviewState} | {detail.briefing.publishState}
            </p>
            <p className="mt-4 text-sm leading-7 text-calm/84">
              {detail.briefing.body.slice(0, 420)}
              {detail.briefing.body.length > 420 ? "..." : ""}
            </p>
          </article>
        ) : null}

        {detail.supersedingBriefing ? (
          <article className="rounded-[22px] border border-signal/16 bg-signal/8 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
              Newer approved briefing
            </p>
            <h3 className="mt-3 text-lg font-semibold text-white">{detail.supersedingBriefing.title}</h3>
            <p className="mt-2 text-sm leading-6 text-calm/82">
              {formatDate(detail.supersedingBriefing.briefingDate)} | published {formatDateTime(detail.supersedingBriefing.createdAt)}
            </p>
          </article>
        ) : null}
      </div>

      <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
          Related evidence
        </p>
        <div className="mt-4 space-y-3">
          {detail.supportingEvents.length ? (
            detail.supportingEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-calm/82">{event.detail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenEvent?.(event.id)}
                    className="rounded-full border border-signal/20 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                  >
                    Open timeline event
                  </button>
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/58">
                  {formatDate(event.date)} | {event.sourceText} | {event.reviewState}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm leading-6 text-calm/72">
              No related canonical events were identified for this queue item yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
