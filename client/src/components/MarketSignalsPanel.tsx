import type { MetricSnapshot } from "@shared/types";
import { formatCurrency, formatDateTime, formatSignedPercent } from "../lib/format";

const definitions = [
  {
    key: "oil_brent",
    label: "Brent",
    detail: "Front-month crude marker",
    accent: "from-[#f59e0b]/18 to-transparent"
  },
  {
    key: "oil_wti",
    label: "WTI",
    detail: "US crude benchmark",
    accent: "from-[#59d3ff]/18 to-transparent"
  },
  {
    key: "gold_price",
    label: "Gold",
    detail: "Risk-off metal signal",
    accent: "from-[#f97316]/18 to-transparent"
  }
] as const;

function buildSparklinePoints(series: number[]): string {
  if (!series.length) {
    return "";
  }

  const width = 220;
  const height = 72;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;

  return series
    .map((value, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function latestDisplay(metric: MetricSnapshot | undefined): string {
  if (!metric) {
    return "No data";
  }

  if (metric.valueText) {
    return metric.valueText;
  }

  if (metric.value === null) {
    return "No data";
  }

  return formatCurrency(metric.value);
}

function changeLabel(current: MetricSnapshot | undefined, previous: MetricSnapshot | undefined): string {
  if (current?.value === null || current?.value === undefined || previous?.value === null || previous?.value === undefined || previous.value === 0) {
    return "No prior comparison";
  }

  const delta = ((current.value - previous.value) / previous.value) * 100;
  return `${formatSignedPercent(delta)} vs prior print`;
}

export function MarketSignalsPanel({
  marketSignals
}: {
  marketSignals: Record<string, MetricSnapshot[]>;
}) {
  return (
    <section className="shell-panel shell-panel-editorial p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow-label">
            Market signals
          </p>
          <h2 className="section-heading text-[2rem]">Live economic pressure lane</h2>
        </div>
        <p className="section-copy max-w-[24rem]">
          Structured commodity snapshots now flow into the canonical metric store instead of leaving oil and safe-haven signals frozen in the legacy bundle.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {definitions.map((definition) => {
          const rows = (marketSignals[definition.key] ?? []).filter((row) => row.value !== null);
          const current = rows.at(-1);
          const previous = rows.at(-2);
          const sparkline = buildSparklinePoints(rows.slice(-14).map((row) => Number(row.value)));

          return (
            <article
              key={definition.key}
              className="relative overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] p-5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${definition.accent}`} />
              <div className="relative">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-calm/62">
                  {definition.label}
                </p>
                <h3 className="mt-3 font-display text-4xl text-white">{latestDisplay(current)}</h3>
                <p className="mt-2 text-sm text-calm/82">{definition.detail}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-signal/70">
                  {changeLabel(current, previous)}
                </p>
                <p className="mt-2 text-xs text-calm/62">
                  {current ? `Last update ${formatDateTime(current.timestamp)}` : "Awaiting live market ingest"}
                </p>

                <div className="mt-5 rounded-[18px] border border-white/8 bg-[#08111b]/90 px-3 py-2">
                  {sparkline ? (
                    <svg viewBox="0 0 220 72" className="h-20 w-full">
                      <polyline
                        fill="none"
                        stroke="rgba(89, 211, 255, 0.95)"
                        strokeWidth="3"
                        points={sparkline}
                      />
                    </svg>
                  ) : (
                    <div className="flex h-20 items-center justify-center text-xs text-calm/60">
                      No recent series yet
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
