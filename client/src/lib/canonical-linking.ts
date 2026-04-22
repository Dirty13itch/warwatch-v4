import type { EntityRecord, EventRecord, SourceRecord, StoryRecord } from "@shared/types";

function normalizeLookup(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitSourceCandidates(value: string): string[] {
  return value
    .split(/[/|;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function findSourceByText(
  sources: SourceRecord[],
  sourceText: string
): SourceRecord | null {
  const candidates = [sourceText, ...splitSourceCandidates(sourceText)].map(normalizeLookup);
  for (const candidate of candidates) {
    const exact =
      sources.find((source) => normalizeLookup(source.name) === candidate) ??
      sources.find((source) => normalizeLookup(source.slug) === candidate);
    if (exact) {
      return exact;
    }
  }

  const normalizedFull = normalizeLookup(sourceText);
  return (
    sources
      .filter((source) => {
        const name = normalizeLookup(source.name);
        return normalizedFull.includes(name) || name.includes(normalizedFull);
      })
      .sort((left, right) => right.name.length - left.name.length)[0] ?? null
  );
}

function entityTerms(entity: EntityRecord): string[] {
  const values = [entity.name, entity.slug.replace(/-/g, " ")];
  return Array.from(
    new Set(
      values
        .flatMap((value) => normalizeLookup(value).split(" "))
        .concat(values.map(normalizeLookup))
        .filter((value) => value.length >= 4)
    )
  );
}

export function relatedStoriesForSource(
  stories: StoryRecord[],
  source: SourceRecord | null
): StoryRecord[] {
  if (!source) {
    return [];
  }

  return stories.filter((story) => findSourceByText([source], story.sourceText)?.id === source.id);
}

export function findEventByReference(
  events: EventRecord[],
  reference: string
): EventRecord | null {
  const normalizedReference = normalizeLookup(reference);
  return (
    events.find((event) => normalizeLookup(event.title) === normalizedReference) ??
    events.find((event) => normalizeLookup(event.title).includes(normalizedReference)) ??
    null
  );
}

export function findEntitiesByText(
  entities: EntityRecord[],
  ...values: Array<string | null | undefined>
): EntityRecord[] {
  const haystack = values
    .map((value) => normalizeLookup(String(value ?? "")))
    .join(" ");

  return entities
    .map((entity) => ({
      entity,
      score: entityTerms(entity).reduce((sum, term) => sum + (haystack.includes(term) ? (term.includes(" ") ? 4 : 1) : 0), 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.entity.name.localeCompare(right.entity.name))
    .map((entry) => entry.entity)
    .slice(0, 4);
}
