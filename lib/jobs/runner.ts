import { finishJobRun, startJobRun } from "../store";
import type { JobRun } from "../types";
import { checkStaleListingsTask } from "./tasks/check-stale-listings";
import { priceDropSuggestionsTask } from "./tasks/price-drop-suggestions";
import { refreshRecommendationsTask } from "./tasks/refresh-recommendations";
import { selfAuditTask } from "./tasks/self-audit";
import type { JobName, JobTask } from "./types";
import { JOB_NAMES } from "./types";

const TASKS: Record<JobName, JobTask> = {
  "refresh-recommendations": refreshRecommendationsTask,
  "check-stale-listings": checkStaleListingsTask,
  "price-drop-suggestions": priceDropSuggestionsTask,
  "self-audit": selfAuditTask,
};

export function isJobName(name: string): name is JobName {
  return (JOB_NAMES as readonly string[]).includes(name);
}

export function listJobs(): { name: JobName; description: string }[] {
  return JOB_NAMES.map((name) => ({ name, description: TASKS[name].description }));
}

/**
 * Runs one job with DB-logged lifecycle: JobRun row opens as running, closes
 * as success/failed with a summary. Jobs only read data and write
 * recommendations/audit rows; marketplace changes always stay with the user.
 */
export async function runJob(name: JobName, dryRun = false): Promise<JobRun> {
  const task = TASKS[name];
  const run = await startJobRun(name, dryRun);
  try {
    const outcome = await task.execute({ dryRun });
    return (
      (await finishJobRun(run.id, {
        status: "success",
        summary: outcome.summary,
        createdRecommendations: outcome.createdRecommendations,
        updatedRecommendations: outcome.updatedRecommendations,
      })) ?? run
    );
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return (
      (await finishJobRun(run.id, {
        status: "failed",
        summary: `Job failed: ${error}`,
        error,
      })) ?? run
    );
  }
}
