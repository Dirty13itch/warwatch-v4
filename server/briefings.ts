import type { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";

function toId(value: string): string {
  return `brief_${crypto.createHash("sha1").update(value).digest("hex").slice(0, 12)}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLatestMetricPair(db: DatabaseSync, key: string): Array<{
  value: number | null;
  valueText: string | null;
}> {
  return db.prepare(`
    SELECT value, value_text AS valueText
    FROM metrics
    WHERE metric_key = ?
    ORDER BY timestamp DESC
    LIMIT 2
  `).all(key) as Array<{
    value: number | null;
    valueText: string | null;
  }>;
}

function formatDelta(current: number | null, previous: number | null): string | null {
  if (current === null || previous === null || previous === 0) {
    return null;
  }

  const deltaPct = ((current - previous) / previous) * 100;
  const sign = deltaPct >= 0 ? "+" : "";
  return `${sign}${deltaPct.toFixed(1)}%`;
}

function buildMarketSentence(db: DatabaseSync): string | null {
  const definitions = [
    ["Brent", "oil_brent"],
    ["WTI", "oil_wti"],
    ["Gold", "gold_price"]
  ] as const;

  const parts = definitions.flatMap(([label, key]) => {
    const [latest, previous] = getLatestMetricPair(db, key);
    if (!latest?.valueText) {
      return [];
    }

    const delta = formatDelta(latest.value, previous?.value ?? null);
    return [`${label} ${latest.valueText}${delta ? ` (${delta} vs prior print)` : ""}`];
  });

  return parts.length ? `Market signals: ${parts.join("; ")}.` : null;
}

export function generateDailyBriefing(db: DatabaseSync, briefingDate = todayIso()): string {
  const existing = db.prepare(`
    SELECT id, title FROM briefings WHERE briefing_date = ?
  `).get(briefingDate) as { id?: string; title?: string } | undefined;
  if (existing?.id && existing.title !== `WarWatch SITREP ${briefingDate}`) {
    return existing.id;
  }

  const recentEvents = db.prepare(`
    SELECT category, significance, title
    FROM events
    WHERE date >= date(?)
      AND review_state IN ('approved', 'auto_published')
      AND visibility <> 'review_only'
    ORDER BY date DESC, COALESCE(time, '00:00Z') DESC
    LIMIT 8
  `).all(`${briefingDate}T00:00:00.000Z`) as Array<{
    category: string;
    significance: string;
    title: string;
  }>;

  const counts = recentEvents.reduce<Record<string, number>>((acc, event) => {
    acc[event.category] = (acc[event.category] ?? 0) + 1;
    return acc;
  }, {});

  const queue = db.prepare(`
    SELECT COUNT(*) AS pending FROM review_queue WHERE status = 'pending'
  `).get() as { pending: number };
  const marketSentence = buildMarketSentence(db);

  const briefingBody = [
    "SITUATION",
    recentEvents.length
      ? `Recent reviewed/public events: ${recentEvents.map((event) => event.title).join("; ")}.`
      : "No newly reviewed public events are available for this cycle.",
    marketSentence ?? "Market-signal lane is still running on seeded values.",
    "",
    "ENEMY",
    `High-risk activity mix: ${counts.iran_strike ?? 0} Iran/proxy strike items, ${counts.cyber ?? 0} cyber/signal items.`,
    "",
    "FRIENDLY",
    `Reviewed/public US or coalition action items: ${counts.us_strike ?? 0}. Diplomatic items: ${counts.diplomatic ?? 0}.`,
    "",
    "ASSESSMENT",
    `Pending review backlog stands at ${queue.pending}. Public truth remains gated away from critical unreviewed claims.`,
    "",
    "OUTLOOK",
    "Primary near-term leverage is to reduce the pending review queue and refresh live-source ingestion."
  ].join("\n");

  const now = new Date().toISOString();
  const id = existing?.id ?? toId(briefingDate);
  db.prepare(`
    INSERT OR REPLACE INTO briefings (
      id, briefing_date, title, body, source_refs_json, review_state, publish_state, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    briefingDate,
    `WarWatch SITREP ${briefingDate}`,
    briefingBody,
    JSON.stringify(recentEvents.map((event) => event.title)),
    "approved",
    "published",
    now
  );

  return id;
}
