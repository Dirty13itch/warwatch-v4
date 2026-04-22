import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import { entityTagsForText } from "../shared/entity-matching.js";
import type { EntityRecord } from "../shared/types.js";

function parseStringArray(value: string | null): string[] {
  const parsed = JSON.parse(value ?? "[]") as unknown;
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

const config = loadConfig();
const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});

try {
  const entities = db.prepare(`
    SELECT * FROM entities
    ORDER BY name ASC
  `).all() as unknown as EntityRecord[];
  const events = db.prepare(`
    SELECT id, title, detail, source_text, tags_json
    FROM events
    ORDER BY date DESC, created_at DESC
  `).all() as Array<{
    id: string;
    title: string;
    detail: string;
    source_text: string;
    tags_json: string | null;
  }>;
  const update = db.prepare(`
    UPDATE events
    SET tags_json = ?
    WHERE id = ?
  `);

  let updatedCount = 0;
  let taggedCount = 0;

  for (const event of events) {
    const existingTags = parseStringArray(event.tags_json);
    const entityTags = entityTagsForText(entities, event.title, event.detail, event.source_text);
    if (entityTags.length) {
      taggedCount += 1;
    }

    const nextTags = uniqueStrings([...existingTags, ...entityTags]);
    if (JSON.stringify(nextTags) === JSON.stringify(existingTags)) {
      continue;
    }

    update.run(JSON.stringify(nextTags), event.id);
    updatedCount += 1;
  }

  console.log(`Backfilled entity tags on ${updatedCount} events (${taggedCount} with canonical matches).`);
} finally {
  db.close();
}
