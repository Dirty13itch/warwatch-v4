import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { FrontSummary, MetricSnapshot } from "@shared/types";
import { formatDate } from "../lib/format";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export function EventVolumeChart({
  history,
  fronts
}: {
  history: MetricSnapshot[];
  fronts: FrontSummary[];
}) {
  const chartData = {
    labels: history.map((item) => formatDate(item.timestamp.slice(0, 10))),
    datasets: [
      {
        label: "Daily event volume",
        data: history.map((item) => item.value ?? 0),
        borderColor: "#59d3ff",
        backgroundColor: "rgba(89, 211, 255, 0.18)",
        fill: true,
        tension: 0.32
      }
    ]
  };

  return (
    <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
          Tempo
        </p>
        <h2 className="font-display text-2xl text-white">Daily event volume from the seeded chronology</h2>
      </div>
      <div className="mt-5">
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                ticks: { color: "#9ab1c2", maxTicksLimit: 8 }
              },
              y: {
                ticks: { color: "#9ab1c2" },
                grid: { color: "rgba(255,255,255,0.08)" }
              }
            }
          }}
        />
      </div>
      <div className="mt-5 space-y-3">
        {fronts.map((front) => (
          <article
            key={front.id}
            className="border-t border-white/8 pt-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">
                {front.icon ? `${front.icon} ` : ""}
                {front.title}
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">
                {front.significance}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-calm/82">{front.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

