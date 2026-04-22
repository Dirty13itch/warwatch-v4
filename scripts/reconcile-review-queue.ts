import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import { classifyFeedEvent } from "../server/db.js";
import { assessConflictScope } from "../server/scope.js";
import { generateDailyBriefing } from "../server/briefings.js";
import { getReviewQueue, getReviewQueueDetail, setQueueStatus } from "../server/store.js";
import { getSynthesisSuggestions, queueClaimSuggestion } from "../server/synthesis.js";
import { initialReviewState, initialVisibility } from "../shared/review.js";

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function updateQueueMetadata(
  db: ReturnType<typeof openDatabase>,
  queueId: string,
  status: "approved" | "rejected",
  metadata: Record<string, unknown>
) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE review_queue
    SET status = ?, updated_at = ?, metadata_json = ?
    WHERE id = ?
  `).run(status, now, JSON.stringify(metadata), queueId);
}

function reconcilePendingEventQueue(db: ReturnType<typeof openDatabase>, queueId: string): string | null {
  const detail = getReviewQueueDetail(db, queueId);
  if (!detail?.event) {
    return null;
  }

  const text = `${detail.event.title}. ${detail.event.detail}`;
  const assessment = assessConflictScope(text);
  const classified = classifyFeedEvent(text);
  const metadata = {
    ...(detail.item.metadata ?? {}),
    autoReconciledAt: new Date().toISOString()
  } satisfies Record<string, unknown>;

  if (!assessment.relevant) {
    const nextTags = uniqueStrings([...detail.event.tags, "scope_rejected"]);
    db.exec("BEGIN");
    try {
      db.prepare(`
        UPDATE events
        SET review_state = 'rejected',
            visibility = 'review_only',
            tags_json = ?
        WHERE id = ?
      `).run(JSON.stringify(nextTags), detail.event.id);

      updateQueueMetadata(db, queueId, "rejected", {
        ...metadata,
        scopeRejected: true,
        scopeBand: assessment.band,
        scopeMatches: assessment.matches
      });
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return "scope_rejected";
  }

  const nextReviewState = initialReviewState(classified.significance, "ingest");
  const nextVisibility = initialVisibility(classified.significance, "ingest");
  if (nextReviewState === "pending") {
    return null;
  }

  db.exec("BEGIN");
  try {
    db.prepare(`
      UPDATE events
      SET category = ?,
          significance = ?,
          review_state = ?,
          visibility = ?,
          tags_json = ?
      WHERE id = ?
    `).run(
      classified.category,
      classified.significance,
      nextReviewState,
      nextVisibility,
      JSON.stringify(uniqueStrings([...detail.event.tags, "auto_reclassified"])),
      detail.event.id
    );

    updateQueueMetadata(db, queueId, "rejected", {
      ...metadata,
      reclassifiedCategory: classified.category,
      reclassifiedSignificance: classified.significance,
      reclassifiedReviewState: nextReviewState,
      reclassifiedVisibility: nextVisibility
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return "reclassified";
}

function reconcilePendingClaimQueue(db: ReturnType<typeof openDatabase>, queueId: string): string | null {
  const detail = getReviewQueueDetail(db, queueId);
  if (!detail?.claim) {
    return null;
  }

  const suggestion = getSynthesisSuggestions(db).claims
    .filter((item) => item.status === "update_claim" && item.matchedClaimId === detail.claim?.id)
    .sort((left, right) => right.eventCount - left.eventCount || right.sourceCount - left.sourceCount)[0];

  if (!suggestion) {
    return null;
  }

  const suggestionQueueId = suggestion.queueId ?? queueClaimSuggestion(db, suggestion.id);
  if (!suggestionQueueId) {
    return null;
  }

  setQueueStatus(db, suggestionQueueId, "approved");
  setQueueStatus(db, queueId, "approved");
  return suggestion.title;
}

function reconcileSupersededBriefingQueue(db: ReturnType<typeof openDatabase>, queueId: string): boolean {
  const detail = getReviewQueueDetail(db, queueId);
  if (!detail?.briefing || !detail.supersedingBriefing) {
    return false;
  }

  if (
    detail.supersedingBriefing.reviewState === "approved" &&
    detail.supersedingBriefing.publishState === "published"
  ) {
    setQueueStatus(db, queueId, "rejected");
    return true;
  }

  return false;
}

const config = loadConfig(process.cwd());
const db = openDatabase({
  dbPath: config.dbPath,
  legacyDir: config.legacyDir,
  blueprintPath: config.blueprintPath
});

const summary = {
  scopeRejectedEvents: 0,
  reclassifiedEvents: 0,
  updatedClaims: 0,
  rejectedBriefings: 0
};

for (const item of getReviewQueue(db).filter((queueItem) => queueItem.status === "pending")) {
  if (item.itemType === "event") {
    const result = reconcilePendingEventQueue(db, item.id);
    if (result === "scope_rejected") {
      summary.scopeRejectedEvents += 1;
    }
    if (result === "reclassified") {
      summary.reclassifiedEvents += 1;
    }
    continue;
  }

  if (item.itemType === "claim") {
    const result = reconcilePendingClaimQueue(db, item.id);
    if (result) {
      summary.updatedClaims += 1;
    }
    continue;
  }

  if (item.itemType === "briefing" && reconcileSupersededBriefingQueue(db, item.id)) {
    summary.rejectedBriefings += 1;
  }
}

generateDailyBriefing(db);

const pendingAfter = db.prepare(`
  SELECT COUNT(*) AS count
  FROM review_queue
  WHERE status = 'pending'
`).get() as { count: number };

console.log(
  JSON.stringify(
    {
      ...summary,
      pendingAfter: pendingAfter.count
    },
    null,
    2
  )
);

db.close();
