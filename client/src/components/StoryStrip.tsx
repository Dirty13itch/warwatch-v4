import type { StoryRecord } from "@shared/types";

export function StoryStrip({
  title,
  copy,
  items
}: {
  title: string;
  copy: string;
  items: StoryRecord[];
}) {
  return (
    <section className="space-y-5 rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">
            {title}
          </p>
          <h2 className="font-display text-2xl text-white">{copy}</h2>
        </div>
        <p className="max-w-[20rem] text-sm text-calm/78">
          Public-facing working set backed by the canonical store.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {items.slice(0, 6).map((item) => (
          <article
            key={item.id}
            className="space-y-3 border-t border-white/8 pt-4 lg:border-t-0 lg:border-l lg:pl-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-calm/62">
                {item.significance}
              </span>
            </div>
            <p className="text-sm leading-6 text-calm/84">{item.detail}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal/70">
              {item.sourceText}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

