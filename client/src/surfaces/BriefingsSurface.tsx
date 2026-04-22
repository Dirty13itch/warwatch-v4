import type { BriefingRecord } from "@shared/types";
import { formatDate } from "../lib/format";

export default function BriefingsSurface({ briefings }: { briefings: BriefingRecord[] }) {
  return (
    <div className="grid gap-5">
      {briefings.map((briefing) => (
        <article
          key={briefing.id}
          className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
                {briefing.title}
              </p>
              <h2 className="font-display text-2xl text-white">{formatDate(briefing.briefingDate)}</h2>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-calm/64">
              {briefing.reviewState} / {briefing.publishState}
            </p>
          </div>
          <pre className="mt-5 whitespace-pre-wrap font-body text-sm leading-7 text-calm/82">
            {briefing.body}
          </pre>
        </article>
      ))}
    </div>
  );
}

