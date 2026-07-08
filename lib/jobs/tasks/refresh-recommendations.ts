import { refreshRecommendations } from "../../store";
import type { JobTask } from "../types";

/**
 * Re-runs the recommendation engine over every item. Fingerprint dedupe means
 * repeated runs are idempotent: unchanged state creates nothing new.
 */
export const refreshRecommendationsTask: JobTask = {
  name: "refresh-recommendations",
  description: "Re-run the recommendation engine across all items",
  async execute({ dryRun }) {
    const result = await refreshRecommendations(dryRun);
    return {
      summary: `${result.created} new suggestion${result.created === 1 ? "" : "s"}, ${result.removed} outdated removed, ${result.pending} pending total${dryRun ? " (dry run, nothing written)" : ""}`,
      createdRecommendations: result.created,
      updatedRecommendations: result.removed,
    };
  },
};
