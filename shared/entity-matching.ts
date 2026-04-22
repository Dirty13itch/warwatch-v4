import type { EntityRecord } from "./types.js";

export function normalizeEntityLookup(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function entityTerms(entity: Pick<EntityRecord, "name" | "slug">): string[] {
  const values = [entity.name, entity.slug.replace(/-/g, " ")];
  return Array.from(
    new Set(
      values
        .flatMap((value) => normalizeEntityLookup(value).split(" "))
        .concat(values.map(normalizeEntityLookup))
        .filter((value) => value.length >= 4)
    )
  );
}

export function entityMatchScore(
  entity: Pick<EntityRecord, "name" | "slug">,
  ...values: Array<string | null | undefined>
): number {
  const haystack = values
    .map((value) => normalizeEntityLookup(String(value ?? "")))
    .join(" ");
  let score = 0;

  for (const term of entityTerms(entity)) {
    if (haystack.includes(term)) {
      score += term.includes(" ") ? 4 : 1;
    }
  }

  return score;
}

export function matchEntitiesByText(
  entities: EntityRecord[],
  ...values: Array<string | null | undefined>
): EntityRecord[] {
  return entities
    .map((entity) => ({
      entity,
      score: entityMatchScore(entity, ...values)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.entity.name.localeCompare(right.entity.name))
    .map((entry) => entry.entity)
    .slice(0, 4);
}

export function entityTagsForText(
  entities: EntityRecord[],
  ...values: Array<string | null | undefined>
): string[] {
  return matchEntitiesByText(entities, ...values).map((entity) => `entity:${entity.slug}`);
}
