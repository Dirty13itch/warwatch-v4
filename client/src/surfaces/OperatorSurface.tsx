import clsx from "clsx";
import type { IngestionRun, ReviewQueueItem } from "@shared/types";
import { formatDateTime } from "../lib/format";

export default function OperatorSurface({
  queue,
  runs,
  onApprove,
  onReject,
  onIngest,
  operatorError
}: {
  queue: ReviewQueueItem[];
  runs: IngestionRun[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onIngest: () => void;
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
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
              Review queue
            </p>
            <h2 className="font-display text-2xl text-white">Critical promotion gate</h2>
          </div>
          <button
            type="button"
            onClick={onIngest}
            className="rounded-full border border-signal/25 bg-signal/12 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-signal transition hover:bg-signal/18"
          >
            Run ingest
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {queue.map((item) => (
            <article
              key={item.id}
              className="rounded-[22px] border border-white/8 bg-white/[0.025] p-4"
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
                    onClick={() => onApprove(item.id)}
                    className="rounded-full border border-[#2f9d65]/25 bg-[#2f9d65]/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#7ef5b0]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(item.id)}
                    className="rounded-full border border-hostile/25 bg-hostile/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-hostile"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-calm/58">
                {item.itemType} | {formatDateTime(item.updatedAt)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
          Ingestion runs
        </p>
        <h2 className="mt-2 font-display text-2xl text-white">Feed health</h2>
        <div className="mt-5 space-y-4">
          {runs.map((run) => (
            <article
              key={run.id}
              className="rounded-[22px] border border-white/8 bg-white/[0.025] p-4"
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
  );
}

