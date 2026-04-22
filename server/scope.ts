import type { DatabaseSync } from "node:sqlite";

type RegexSignal = {
  label: string;
  regex: RegExp;
};

type PairedSignal = {
  label: string;
  patterns: RegExp[];
};

export interface ScopeAssessment {
  relevant: boolean;
  band: "core_conflict" | "regional_spillover" | "off_scope";
  score: number;
  matches: string[];
}

const coreSignals: RegexSignal[] = [
  { label: "iran", regex: /\biran(?:ian|ians)?\b/i },
  { label: "hormuz", regex: /\b(?:strait of )?hormuz\b|\bpersian gulf\b/i },
  {
    label: "iran_nuclear",
    regex: /\b(?:natanz|fordow|isfahan|uranium|enrichment|centrifuge|iaea|nuclear program|nuclear bomb)\b/i
  }
];

const regionalSignals: RegexSignal[] = [
  { label: "hezbollah", regex: /\bhezbollah\b/i },
  { label: "houthi", regex: /\bhouthis?\b/i }
];

const pairedSignals: PairedSignal[] = [
  {
    label: "us_iran",
    patterns: [/\b(?:u\.s\.|united states|american|centcom|pentagon|trump)\b/i, /\biran(?:ian|ians)?\b/i]
  },
  {
    label: "israel_lebanon",
    patterns: [/\bisrael(?:i)?\b/i, /\bleban(?:on|ese)\b/i]
  },
  {
    label: "israel_gaza",
    patterns: [/\bisrael(?:i)?\b/i, /\bgaza\b/i]
  },
  {
    label: "israel_west_bank",
    patterns: [/\bisrael(?:i)?\b/i, /\bwest bank\b/i]
  },
  {
    label: "pakistan_iran",
    patterns: [/\b(?:pakistan|islamabad)\b/i, /\biran(?:ian|ians)?\b/i]
  },
  {
    label: "red_sea_naval",
    patterns: [/\bred sea\b/i, /\b(?:carrier|fleet|navy|marine|warship|uss)\b/i]
  }
];

const contextSignals: RegexSignal[] = [
  { label: "military", regex: /\b(?:missile|strike|bomb|drone|rocket|raid|attack|attacked|seized|carrier|warship|navy|marine|troops?)\b/i },
  { label: "shipping", regex: /\b(?:ship|ships|shipping|tanker|vessel|blockade|refinery|oil|pipeline|lng)\b/i },
  { label: "diplomacy", regex: /\b(?:ceasefire|talks|negotiation|broker|deadline|deal|summit|sanction|peace)\b/i },
  { label: "infrastructure", regex: /\b(?:infrastructure|settler|settlers|block|blocked|occupation|water)\b/i },
  { label: "cyber", regex: /\b(?:internet|cyber|jamming|gps|satellite|network)\b/i }
];

const excludedSignals: RegexSignal[] = [
  { label: "sports", regex: /\b(?:football|soccer|world cup|premier league|goal|match|team|tournament|burnley|manchester city)\b/i },
  { label: "travel_culture", regex: /\b(?:museum|artifact|helmet|tourist|tourism|pyramids|festival|concert)\b/i },
  {
    label: "defense_industry",
    regex: /\b(?:columbia-class|submarine czar|shipbuilding|sea-air-space symposium|battle force deployed underway)\b/i
  },
  {
    label: "force_tracker",
    regex: /\b(?:fleet and marine tracker|carrier strike groups throughout the world|deployed underway)\b/i
  }
];

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function assessConflictScope(text: string): ScopeAssessment {
  const normalized = text.toLowerCase();
  const coreMatches = coreSignals.filter((signal) => signal.regex.test(normalized)).map((signal) => signal.label);
  const regionalMatches = regionalSignals
    .filter((signal) => signal.regex.test(normalized))
    .map((signal) => signal.label);
  const pairedMatches = pairedSignals
    .filter((signal) => signal.patterns.every((pattern) => pattern.test(normalized)))
    .map((signal) => signal.label);
  const contextMatches = contextSignals
    .filter((signal) => signal.regex.test(normalized))
    .map((signal) => signal.label);
  const excludedMatches = excludedSignals
    .filter((signal) => signal.regex.test(normalized))
    .map((signal) => signal.label);

  const positiveRelevant = coreMatches.length > 0 || regionalMatches.length > 0 || pairedMatches.length > 0;
  const excludedOnly = excludedMatches.length > 0 && contextMatches.length === 0 && regionalMatches.length === 0 && pairedMatches.length === 0;
  const relevant = positiveRelevant && !excludedOnly;
  const band = coreMatches.length
    ? "core_conflict"
    : regionalMatches.length || pairedMatches.length
      ? "regional_spillover"
      : "off_scope";

  return {
    relevant,
    band,
    score:
      coreMatches.length * 4 +
      (regionalMatches.length + pairedMatches.length) * 3 +
      Math.min(contextMatches.length, 3) -
      excludedMatches.length,
    matches: unique([...coreMatches, ...regionalMatches, ...pairedMatches, ...contextMatches, ...excludedMatches])
  };
}

export function quarantineOutOfScopeFeedEvents(
  db: DatabaseSync,
  feedName: string
): { quarantinedEvents: number; rejectedQueueItems: number } {
  const rows = db.prepare(`
    SELECT id, title, detail, tags_json, review_state
    FROM events
    WHERE source_text LIKE $feed
      AND tags_json LIKE '%auto_ingest%'
      AND review_state IN ('auto_published', 'pending')
  `).all({
    feed: `%${feedName}%`
  }) as Array<{
    id: string;
    title: string;
    detail: string;
    tags_json: string;
    review_state: string;
  }>;

  let quarantinedEvents = 0;
  let rejectedQueueItems = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    const assessment = assessConflictScope(`${row.title} ${row.detail}`);
    if (assessment.relevant) {
      continue;
    }

    const nextTags = unique([
      ...(JSON.parse(row.tags_json ?? "[]") as string[]),
      "scope_rejected"
    ]);

    db.prepare(`
      UPDATE events
      SET review_state = 'rejected', visibility = 'review_only', tags_json = ?
      WHERE id = ?
    `).run(JSON.stringify(nextTags), row.id);
    quarantinedEvents += 1;

    const queueRow = db.prepare(`
      SELECT id, metadata_json
      FROM review_queue
      WHERE item_type = 'event' AND item_id = ? AND status = 'pending'
      LIMIT 1
    `).get(row.id) as { id: string; metadata_json: string } | undefined;

    if (queueRow) {
      const metadata = JSON.parse(queueRow.metadata_json ?? "{}") as Record<string, unknown>;
      metadata.scopeRejected = true;
      metadata.scopeBand = assessment.band;
      metadata.scopeMatches = assessment.matches;
      db.prepare(`
        UPDATE review_queue
        SET status = 'rejected', updated_at = ?, metadata_json = ?
        WHERE id = ?
      `).run(now, JSON.stringify(metadata), queueRow.id);
      rejectedQueueItems += 1;
    }
  }

  return { quarantinedEvents, rejectedQueueItems };
}
