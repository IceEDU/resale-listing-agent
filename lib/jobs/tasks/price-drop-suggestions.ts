import { listRecommendations, refreshRecommendations } from "../../store";
import type { JobTask } from "../types";

/**
 * Runs the engine pass, then reports how many price-drop suggestions are
 * waiting for approval. Price changes are never applied automatically.
 */
export const priceDropSuggestionsTask: JobTask = {
  name: "price-drop-suggestions",
  description: "Surface pending price-drop suggestions after an engine pass",
  async execute({ dryRun }) {
    const result = await refreshRecommendations(dryRun);
    const pendingDrops = (await listRecommendations()).filter(
      (r) => r.status === "pending" && r.type === "price_drop",
    ).length;
    return {
      summary: `${pendingDrops} price-drop suggestion${pendingDrops === 1 ? "" : "s"} awaiting approval${dryRun ? " (dry run)" : ""}`,
      createdRecommendations: result.created,
    };
  },
};
