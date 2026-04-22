import { describe, expect, it } from "vitest";
import {
  canPublish,
  initialReviewState,
  initialVisibility,
  requiresHumanReview
} from "./review";

describe("review gating", () => {
  it("requires human review for critical ingest items", () => {
    expect(requiresHumanReview("critical")).toBe(true);
    expect(initialReviewState("critical", "ingest")).toBe("pending");
    expect(initialVisibility("critical", "ingest")).toBe("review_only");
    expect(canPublish("pending", "review_only")).toBe(false);
  });

  it("allows non-critical auto-published secondary items", () => {
    expect(initialReviewState("medium", "ingest")).toBe("auto_published");
    expect(initialVisibility("medium", "ingest")).toBe("secondary");
    expect(canPublish("auto_published", "secondary")).toBe(true);
  });
});

