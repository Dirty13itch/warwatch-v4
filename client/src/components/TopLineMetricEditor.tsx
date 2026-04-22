import { useEffect, useState, type FormEvent } from "react";
import { getTopLineMetricDefinition } from "@shared/topline";
import type { OperatorMetricPublishInput, OperatorTopLineMetric } from "@shared/types";
import { formatDateTime } from "../lib/format";

export function TopLineMetricEditor({
  metric,
  onPublish,
  isPublishing
}: {
  metric: OperatorTopLineMetric;
  onPublish: (key: string, payload: OperatorMetricPublishInput) => Promise<void>;
  isPublishing: boolean;
}) {
  const definition = getTopLineMetricDefinition(metric.key);
  const [numericValue, setNumericValue] = useState(metric.current?.value?.toString() ?? "");
  const [valueText, setValueText] = useState(metric.current?.valueText ?? "");
  const [sourceText, setSourceText] = useState(metric.current?.sourceText ?? "");
  const [confidence, setConfidence] = useState(metric.current?.confidence ?? "reported");
  const [note, setNote] = useState(String(metric.current?.meta.note ?? ""));

  useEffect(() => {
    setNumericValue(metric.current?.value?.toString() ?? "");
    setValueText(metric.current?.valueText ?? "");
    setSourceText(metric.current?.sourceText ?? "");
    setConfidence(metric.current?.confidence ?? "reported");
    setNote(String(metric.current?.meta.note ?? ""));
  }, [metric.key, metric.current?.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onPublish(metric.key, {
      value: numericValue.trim() ? Number(numericValue) : null,
      valueText: valueText.trim(),
      sourceText: sourceText.trim(),
      confidence,
      note: note.trim()
    });
  }

  return (
    <article className="rounded-[22px] border border-white/8 bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal/72">
            {metric.label}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {metric.current?.valueText ?? "No current snapshot"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-calm/82">
            {definition.operatorPrompt}
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">
            {metric.current
              ? `${metric.current.freshness} | ${formatDateTime(metric.current.timestamp)}`
              : "Awaiting reviewed refresh"}
          </p>
          {metric.current?.sourceText ? (
            <p className="mt-2 text-xs leading-5 text-calm/70">
              Source: {metric.current.sourceText}
            </p>
          ) : null}
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-calm/70">
          {metric.current?.confidence ?? "seeded"}
        </span>
      </div>

      <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-calm/80">
            <span>Display value</span>
            <input
              value={valueText}
              onChange={(event) => setValueText(event.target.value)}
              placeholder={definition.valuePlaceholder}
              className="rounded-[16px] border border-white/10 bg-[#08111b] px-3 py-2 text-white outline-none transition focus:border-signal/35"
            />
          </label>
          <label className="grid gap-2 text-sm text-calm/80">
            <span>Numeric value (optional)</span>
            <input
              type="number"
              value={numericValue}
              onChange={(event) => setNumericValue(event.target.value)}
              placeholder="Optional numeric value"
              className="rounded-[16px] border border-white/10 bg-[#08111b] px-3 py-2 text-white outline-none transition focus:border-signal/35"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
          <label className="grid gap-2 text-sm text-calm/80">
            <span>Source basis</span>
            <input
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder={definition.sourcePlaceholder}
              className="rounded-[16px] border border-white/10 bg-[#08111b] px-3 py-2 text-white outline-none transition focus:border-signal/35"
            />
          </label>
          <label className="grid gap-2 text-sm text-calm/80">
            <span>Confidence</span>
            <select
              value={confidence}
              onChange={(event) => setConfidence(event.target.value as OperatorMetricPublishInput["confidence"])}
              className="rounded-[16px] border border-white/10 bg-[#08111b] px-3 py-2 text-white outline-none transition focus:border-signal/35"
            >
              <option value="confirmed">confirmed</option>
              <option value="reported">reported</option>
              <option value="claimed">claimed</option>
              <option value="disputed">disputed</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm text-calm/80">
          <span>Operator note</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Why this refresh is defensible."
            className="rounded-[16px] border border-white/10 bg-[#08111b] px-3 py-2 text-white outline-none transition focus:border-signal/35"
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs leading-5 text-calm/62">
            Publishing creates an approved canonical snapshot with `operator_reviewed` freshness.
          </p>
          <button
            type="submit"
            disabled={isPublishing || !valueText.trim() || !sourceText.trim()}
            className="rounded-full border border-signal/25 bg-signal/12 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-signal transition hover:bg-signal/18 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPublishing ? "Publishing" : "Publish review"}
          </button>
        </div>
      </form>
    </article>
  );
}
