import clsx from "clsx";
import type {
  IngestionRun,
  OperatorMetricPublishInput,
  OperatorSynthesisSnapshot,
  OperatorTopLineSuggestion,
  OperatorTopLineMetric,
  ReviewQueueDetail,
  ReviewQueueItem,
  ReviewQueueSummary
} from "@shared/types";
import { formatDateTime, formatRelativeHours } from "../lib/format";
import { ReviewQueueDetailPanel } from "../components/ReviewQueueDetailPanel";
import { TopLineMetricEditor } from "../components/TopLineMetricEditor";
import { OperatorSynthesisPanel } from "../components/OperatorSynthesisPanel";

export default function OperatorSurface({
  queue,
  queueSummary,
  runs,
  topLineMetrics,
  topLineSuggestions,
  synthesis,
  selectedQueueId,
  reviewQueueDetail,
  onApprove,
  onReject,
  onIngest,
  onSelectQueueItem,
  onOpenEvent,
  onOpenEntity,
  onQueueStorySuggestion,
  onQueueClaimSuggestion,
  onOpenQueuedReview,
  onPublishMetric,
  publishingMetricKey,
  operatorError
}: {
  queue: ReviewQueueItem[];
  queueSummary: ReviewQueueSummary | null;
  runs: IngestionRun[];
  topLineMetrics: OperatorTopLineMetric[];
  topLineSuggestions: OperatorTopLineSuggestion[];
  synthesis: OperatorSynthesisSnapshot;
  selectedQueueId: string | null;
  reviewQueueDetail: ReviewQueueDetail | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onIngest: () => void;
  onSelectQueueItem: (id: string) => void;
  onOpenEvent?: (eventId: string) => void;
  onOpenEntity?: (key: string) => void;
  onQueueStorySuggestion: (suggestionId: string) => Promise<void>;
  onQueueClaimSuggestion: (suggestionId: string) => Promise<void>;
  onOpenQueuedReview: (queueId: string) => Promise<void>;
  onPublishMetric: (key: string, payload: OperatorMetricPublishInput) => Promise<void>;
  publishingMetricKey: string | null;
  operatorError: string | null;
}) {
  if (operatorError) {
    return (
      <section className="rounded-[28px] border border-hostile/30 bg-hostile/10 p-5 text-calm">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hostile">Operator access</p>
        <p className="mt-3 text-sm leading-6">
          {operatorError}
        </p>
      </section>
    );
  }

  return (
    <div
      className="space-y-6"
      data-preview="operator-surface"
    >
      <section
        className="shell-panel p-5"
        data-preview="topline-control"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow-label">
              Top-line control
            </p>
            <h2 className="section-heading text-[2rem]">Reviewed KPI refresh lane</h2>
          </div>
          <p className="section-copy max-w-[28rem]">
            Use the operator lane to replace seeded strike, Hormuz, casualty, or oil values with reviewed snapshots, or publish an explicit reviewed hold when a current number is not yet defensible.
          </p>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {topLineMetrics.map((metric) => (
            <TopLineMetricEditor
              key={metric.key}
              metric={metric}
              suggestion={topLineSuggestions.find((item) => item.key === metric.key)}
              onPublish={onPublishMetric}
              onOpenEvent={onOpenEvent}
              isPublishing={publishingMetricKey === metric.key}
            />
          ))}
        </div>
      </section>

      <OperatorSynthesisPanel
        synthesis={synthesis}
        onOpenEvent={onOpenEvent}
        onOpenEntity={onOpenEntity}
        onQueueStorySuggestion={onQueueStorySuggestion}
        onQueueClaimSuggestion={onQueueClaimSuggestion}
        onOpenQueuedReview={onOpenQueuedReview}
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section
          className="shell-panel p-5"
          data-preview="operator-queue"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow-label">
                Review queue
              </p>
              <h2 className="section-heading text-[2rem]">Critical promotion gate</h2>
            </div>
            <button
              type="button"
              onClick={onIngest}
              className="interactive-pill interactive-pill--active"
            >
              Run ingest
            </button>
          </div>
          <div
            className="mt-5 grid gap-3 md:grid-cols-4"
            data-preview="operator-queue-summary"
          >
            {[
              ["Pending", String(queueSummary?.pending ?? 0)],
              ["Critical", String(queueSummary?.critical ?? 0)],
              [">24h", String(queueSummary?.olderThan24h ?? 0)],
              ["Oldest", formatRelativeHours(queueSummary?.oldestPendingHours ?? null)]
            ].map(([label, value]) => (
              <div
                key={label}
                className={`p-3 ${label === "Critical" ? "subtle-card subtle-card-warm" : label === "Pending" ? "subtle-card subtle-card-strong" : "subtle-card"}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">{label}</p>
                <p className="mt-2 font-display text-2xl text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-4">
            {queue.map((item) => (
              <article
                key={item.id}
                onClick={() => onSelectQueueItem(item.id)}
                className={clsx(
                  "rounded-[22px] border p-4 transition",
                  selectedQueueId === item.id
                    ? "subtle-card subtle-card-strong border-signal/20"
                    : "subtle-card hover:border-white/14 hover:bg-white/[0.05]"
                )}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-hostile/78">
                      {item.severity}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-calm/82">{item.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onApprove(item.id);
                      }}
                      className="rounded-full border border-[#2f9d65]/25 bg-[#2f9d65]/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#7ef5b0]"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onReject(item.id);
                      }}
                      className="rounded-full border border-hostile/25 bg-hostile/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-hostile"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-calm/58">
                  {item.itemType} | {item.ageBucket} | {formatRelativeHours(item.ageHours)} | {formatDateTime(item.updatedAt)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <ReviewQueueDetailPanel
            detail={reviewQueueDetail}
            onOpenEvent={onOpenEvent}
            onOpenEntity={onOpenEntity}
          />

          <section className="shell-panel shell-panel-editorial p-5">
            <p className="eyebrow-label">
              Ingestion runs
            </p>
            <h2 className="section-heading mt-2 text-[2rem]">Feed health</h2>
            <div className="mt-5 space-y-4">
              {runs.map((run) => (
                <article
                  key={run.id}
                  className="subtle-card p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{run.feedName}</h3>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-calm/58">
                        {run.runType} | {formatDateTime(run.startedAt)}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em]",
                        run.status === "success"
                          ? "border border-[#2f9d65]/25 bg-[#2f9d65]/10 text-[#7ef5b0]"
                          : "border border-hostile/25 bg-hostile/10 text-hostile"
                      )}
                    >
                      {run.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-calm/82">{run.summary}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
