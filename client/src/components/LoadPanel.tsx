export function LoadPanel({
  eyebrow,
  title,
  detail
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <section className="rounded-[28px] border border-line/80 bg-shell/72 p-5 shadow-shell">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal/68">{eyebrow}</p>
      <h2 className="mt-3 font-display text-2xl text-white">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-calm/80">{detail}</p>
    </section>
  );
}

