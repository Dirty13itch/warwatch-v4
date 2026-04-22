import type { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";

function toId(value: string): string {
  return `brief_${crypto.createHash("sha1").update(value).digest("hex").slice(0, 12)}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateDailyBriefing(db: DatabaseSync, briefingDate = todayIso()): string {
  const existing = db.prepare(`
    SELECT id FROM briefings WHERE briefing_date = ?
  `).get(briefingDate) as { id?: string } | undefined;
  if (existing?.id) {
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

  const briefingBody = [
    "SITUATION",
    recentEvents.length
      ? `Recent reviewed/public events: ${recentEvents.map((event) => event.title).join("; ")}.`
      : "No newly reviewed public events are available for this cycle.",
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
  const id = toId(briefingDate);
  db.prepare(`
    INSERT INTO briefings (
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
