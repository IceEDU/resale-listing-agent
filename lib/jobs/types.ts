export const JOB_NAMES = [
  "refresh-recommendations",
  "check-stale-listings",
  "price-drop-suggestions",
  "self-audit",
] as const;

export type JobName = (typeof JOB_NAMES)[number];

export type JobContext = { dryRun: boolean };

export type JobOutcome = {
  summary: string;
  createdRecommendations?: number;
  updatedRecommendations?: number;
};

export type JobTask = {
  name: JobName;
  description: string;
  execute(ctx: JobContext): Promise<JobOutcome>;
};
