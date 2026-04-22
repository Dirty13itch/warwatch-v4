import { describe, expect, it } from "vitest";
import { entityMatchScore, matchEntitiesByText } from "./entity-matching";
import type { EntityRecord } from "./types";

const entities: EntityRecord[] = [
  {
    id: "entity_iran",
    slug: "iran",
    name: "Iran",
    kind: "state",
    summary: "Primary state actor."
  },
  {
    id: "entity_hormuz",
    slug: "strait-of-hormuz",
    name: "Strait of Hormuz",
    kind: "chokepoint",
    summary: "Critical maritime chokepoint."
  }
];

describe("shared entity matching", () => {
  it("scores direct and slug-based matches", () => {
    expect(entityMatchScore(entities[0], "Iran says it seized ships")).toBeGreaterThan(0);
    expect(entityMatchScore(entities[1], "Shipping in the Strait of Hormuz remains constrained")).toBeGreaterThan(0);
  });

  it("returns ranked matching entities for multi-signal text", () => {
    const matches = matchEntitiesByText(
      entities,
      "Iran and shipping pressure in the Strait of Hormuz",
      "Regional escalation remains possible."
    );

    expect(matches.map((entity) => entity.slug)).toContain("iran");
    expect(matches.map((entity) => entity.slug)).toContain("strait-of-hormuz");
  });
});
