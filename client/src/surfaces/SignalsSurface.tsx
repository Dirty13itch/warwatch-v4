import type { MetricSnapshot, SourceRecord, StoryRecord } from "@shared/types";
import { MarketSignalsPanel } from "../components/MarketSignalsPanel";
import { SourceTable } from "../components/SourceTable";
import { StoryStrip } from "../components/StoryStrip";

export default function SignalsSurface({
  indicators,
  stories,
  sources,
  marketSignals,
  focusedSourceSlug,
  onFocusSource
}: {
  indicators: StoryRecord[];
  stories: StoryRecord[];
  sources: SourceRecord[];
  marketSignals: Record<string, MetricSnapshot[]>;
  focusedSourceSlug?: string | null;
  onFocusSource?: (slug: string) => void;
}) {
  return (
    <div
      className="space-y-6"
      data-preview="signals-surface"
    >
      <MarketSignalsPanel marketSignals={marketSignals} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <StoryStrip
          title="Signals"
          copy="Unconventional indicators with explicit source labeling"
          items={indicators}
        />
        <SourceTable
          sources={sources}
          stories={stories}
          focusedSourceSlug={focusedSourceSlug}
          onFocusSource={onFocusSource}
        />
      </div>
    </div>
  );
}
