import type { SourceRecord, StoryRecord } from "@shared/types";
import { SourceTable } from "../components/SourceTable";
import { StoryStrip } from "../components/StoryStrip";

export default function SignalsSurface({
  indicators,
  sources
}: {
  indicators: StoryRecord[];
  sources: SourceRecord[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <StoryStrip
        title="Signals"
        copy="Unconventional indicators with explicit source labeling"
        items={indicators}
      />
      <SourceTable sources={sources} />
    </div>
  );
}

