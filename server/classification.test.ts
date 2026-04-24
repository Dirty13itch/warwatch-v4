import { describe, expect, it } from "vitest";
import { classifyFeedEvent } from "./db";
import { assessConflictScope } from "./scope";

describe("feed classification guardrails", () => {
  it("keeps Iran nuclear explainers out of strike classification", () => {
    const classified = classifyFeedEvent(
      "What is uranium enrichment and how quickly could Iran build a nuclear bomb?"
    );

    expect(classified.category).toBe("intel");
    expect(classified.significance).toBe("high");
  });

  it("keeps defense-industrial submarine coverage out of the conflict scope lane", () => {
    const text =
      "On Time Columbia-class Delivery is Life or Death Imperative, Sub Czar Gaucher Says. " +
      "Vice Adm. Rob Gaucher described the imperative to deliver the first Columbia-class ballistic missile submarine " +
      "during a Tuesday panel at the Navy League's Sea-Air-Space Symposium.";

    const classified = classifyFeedEvent(text);
    const scoped = assessConflictScope(text);

    expect(classified.category).toBe("intel");
    expect(classified.significance).toBe("medium");
    expect(scoped.relevant).toBe(false);
    expect(scoped.band).toBe("off_scope");
    expect(scoped.matches).toContain("defense_industry");
  });

  it("downranks strategic lessons articles so they do not auto-queue as critical strike items", () => {
    const classified = classifyFeedEvent(
      "Iran Conflict Holds Lessons for U.S., Adversaries, IndoPACOM Commander Says. " +
        "The Abraham Lincoln Carrier Strike Group was retasked from the Pacific to support operations tied to the Iran conflict."
    );

    expect(classified.category).toBe("intel");
    expect(classified.significance).toBe("medium");
  });

  it("downranks regional casualty coverage so it does not reopen the critical queue", () => {
    const classified = classifyFeedEvent(
      "Israeli strikes kill eight Palestinians in Gaza, first responders say. " +
        "One strike killed three children and two adults near a mosque in the northern town of Beit Lahia on Wednesday evening."
    );

    expect(classified.category).toBe("regional_strike");
    expect(classified.significance).toBe("high");
  });

  it("downranks journalist-targeting spillover items so they stay out of the critical queue", () => {
    const classified = classifyFeedEvent(
      "Lebanon accuses Israel of targeting journalist killed in air strike. " +
        "Lebanon's prime minister accused Israel of war crimes after IDF attacks on Red Cross vehicles also stopped rescuers from reaching the site."
    );

    expect(classified.category).toBe("regional_strike");
    expect(classified.significance).toBe("high");
  });

  it("still treats core Iran strike escalators as critical", () => {
    const classified = classifyFeedEvent(
      "US strikes near Natanz kill senior IRGC commander as Iran threatens Hormuz closure."
    );

    expect(classified.category).toBe("iran_strike");
    expect(classified.significance).toBe("critical");
  });
});
