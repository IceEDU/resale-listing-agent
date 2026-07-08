import type { AgentInput } from "../agent/types";
import type {
  AuditFinding,
  AuditResult,
  Insight,
  Item,
  JobRun,
  JobStatus,
  Listing,
  ListingStatus,
  MarketplaceId,
  MetricEntry,
  Recommendation,
  RecommendationFeedEntry,
  RecommendationStatus,
} from "../types";

export type RefreshResult = { created: number; removed: number; pending: number };

export type ListingMetaPatch = Partial<
  Pick<
    Listing,
    | "postedAt"
    | "lastCheckedAt"
    | "lastRefreshedAt"
    | "nextReviewAt"
    | "manualStatusNote"
    | "externalUrl"
  >
>;

export type JobRunPatch = {
  status: JobStatus;
  summary: string;
  error?: string;
  createdRecommendations?: number;
  updatedRecommendations?: number;
};

/**
 * Data-access contract shared by the mock (in-memory) and Prisma (Postgres)
 * implementations. lib/store.ts picks one at runtime based on DATABASE_URL.
 */
export interface Repository {
  listItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(input: AgentInput): Promise<Item>;
  updateItem(id: string, patch: Partial<Item>): Promise<Item | undefined>;
  refreshInsight(id: string): Promise<Insight | undefined>;
  upsertListing(id: string, listing: Listing): Promise<Item | undefined>;
  setListingStatus(
    id: string,
    marketplace: MarketplaceId,
    status: ListingStatus,
  ): Promise<Item | undefined>;
  listRecommendations(): Promise<RecommendationFeedEntry[]>;
  setRecommendationStatus(
    id: string,
    status: RecommendationStatus,
  ): Promise<Recommendation | undefined>;
  refreshRecommendations(dryRun?: boolean): Promise<RefreshResult>;
  addMetric(
    itemId: string,
    metric: Omit<MetricEntry, "id" | "createdAt">,
  ): Promise<Item | undefined>;
  updateListingMeta(
    id: string,
    marketplace: MarketplaceId,
    patch: ListingMetaPatch,
  ): Promise<Item | undefined>;
  startJobRun(jobName: string, dryRun: boolean): Promise<JobRun>;
  finishJobRun(id: string, patch: JobRunPatch): Promise<JobRun | undefined>;
  listJobRuns(limit?: number): Promise<JobRun[]>;
  saveAuditResults(findings: AuditFinding[]): Promise<number>;
  listAuditResults(limit?: number): Promise<AuditResult[]>;
}
