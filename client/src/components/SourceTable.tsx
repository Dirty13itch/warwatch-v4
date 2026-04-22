import type { SourceRecord } from "@shared/types";

export function SourceTable({ sources }: { sources: SourceRecord[] }) {
  return (
    <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
            Source posture
          </p>
          <h2 className="font-display text-2xl text-white">Reliability and bias ledger</h2>
        </div>
        <p className="max-w-[22rem] text-sm text-calm/78">
          Public shell now separates source weighting from event display instead of flattening every source into a single feed.
        </p>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="font-mono text-[11px] uppercase tracking-[0.22em] text-calm/62">
            <tr>
              <th className="border-b border-white/8 pb-3 pr-5">Source</th>
              <th className="border-b border-white/8 pb-3 pr-5">Type</th>
              <th className="border-b border-white/8 pb-3 pr-5">Reliability</th>
              <th className="border-b border-white/8 pb-3">Bias</th>
            </tr>
          </thead>
          <tbody>
            {sources.slice(0, 12).map((source) => (
              <tr key={source.id}>
                <td className="border-b border-white/6 py-3 pr-5 text-white">{source.name}</td>
                <td className="border-b border-white/6 py-3 pr-5 text-calm/82">{source.type}</td>
                <td className="border-b border-white/6 py-3 pr-5 text-calm/82">
                  {(source.reliabilityScore * 100).toFixed(0)}%
                </td>
                <td className="border-b border-white/6 py-3 text-calm/82">{source.biasDirection}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

