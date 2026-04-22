import type { ReviewState, Significance, Visibility } from "./types.js";

export function requiresHumanReview(significance: Significance): boolean {
  return significance === "critical";
}

export function initialReviewState(
  significance: Significance,
  origin: "manual" | "ingest" = "manual"
): ReviewState {
  if (origin === "manual") {
    return "approved";
  }

  return requiresHumanReview(significance) ? "pending" : "auto_published";
}

export function initialVisibility(
  significance: Significance,
  origin: "manual" | "ingest" = "manual"
): Visibility {
  if (origin === "manual") {
    return "primary";
  }

  return requiresHumanReview(significance) ? "review_only" : "secondary";
}

export function canPublish(reviewState: ReviewState, visibility: Visibility): boolean {
  if (reviewState === "rejected") {
    return false;
  }

  if (visibility === "review_only") {
    return false;
  }

  return reviewState === "approved" || reviewState === "auto_published";
}

export function severityFromSignificance(
  significance: Significance
): "critical" | "high" | "medium" {
  if (significance === "critical") {
    return "critical";
  }

  if (significance === "high") {
    return "high";
  }

  return "medium";
}
