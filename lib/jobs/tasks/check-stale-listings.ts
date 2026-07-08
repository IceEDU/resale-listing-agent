import { listItems, updateListingMeta } from "../../store";
import type { JobTask } from "../types";

const STALE_DAYS = 14;
const REVIEW_INTERVAL_DAYS = 7;

function ageDays(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Flags assisted listings that have sat unposted-fresh for 14+ days: stamps
 * lastCheckedAt, schedules nextReviewAt, and lets the engine pass (triggered
 * by the meta update) emit repost/refresh recommendations. Never reposts
 * anything itself.
 */
export const checkStaleListingsTask: JobTask = {
  name: "check-stale-listings",
  description: "Detect stale assisted listings and schedule review reminders",
  async execute({ dryRun }) {
    const items = await listItems();
    let flagged = 0;
    for (const item of items) {
      for (const listing of item.listings) {
        const live = listing.status === "active" || listing.status === "assisted_posted";
        if (!live || listing.mode !== "assisted" || !listing.postedAt) continue;
        const freshness = listing.lastRefreshedAt ?? listing.postedAt;
        if (ageDays(freshness) < STALE_DAYS) continue;
        flagged++;
        if (!dryRun) {
          const now = new Date();
          await updateListingMeta(item.id, listing.marketplace, {
            lastCheckedAt: now.toISOString(),
            nextReviewAt: new Date(
              now.getTime() + REVIEW_INTERVAL_DAYS * 86_400_000,
            ).toISOString(),
          });
        }
      }
    }
    return {
      summary: `${flagged} stale assisted listing${flagged === 1 ? "" : "s"} flagged for manual repost${dryRun ? " (dry run)" : ""}`,
    };
  },
};
