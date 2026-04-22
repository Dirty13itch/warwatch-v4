import type { EntityRecord, MetricSnapshot, SourceRecord, StoryRecord } from "@shared/types";
import { MarketSignalsPanel } from "../components/MarketSignalsPanel";
import { SourceTable } from "../components/SourceTable";
import { StoryStrip } from "../components/StoryStrip";

export default function SignalsSurface({
  indicators,
  stories,
  entities,
  sources,
  marketSignals,
  focusedSourceSlug,
  onFocusSource,
  onOpenEntity
}: {
  indicators: StoryRecord[];
  stories: StoryRecord[];
  entities: EntityRecord[];
  sources: SourceRecord[];
  marketSignals: Record<string, MetricSnapshot[]>;
  focusedSourceSlug?: string | null;
  onFocusSource?: (slug: string) => void;
  onOpenEntity?: (key: string) => void;
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
          entities={entities}
          onOpenEntity={onOpenEntity}
        />
        <SourceTable
          sources={sources}
          stories={stories}
          entities={entities}
          focusedSourceSlug={focusedSourceSlug}
          onFocusSource={onFocusSource}
          onOpenEntity={onOpenEntity}
        />
      </div>
    </div>
  );
}
