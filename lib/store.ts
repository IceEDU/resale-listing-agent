import type { AgentInput } from "./agent/types";
import { mockRepo } from "./repo/mock";
import { prismaRepo } from "./repo/prisma";
import type {
  JobRunPatch,
  ListingMetaPatch,
  RefreshResult,
  Repository,
} from "./repo/types";
import type {
  AuditFinding,
  AuditResult,
  Insight,
  Item,
  JobRun,
  Listing,
  ListingStatus,
  MarketplaceId,
  MetricEntry,
  Recommendation,
  RecommendationFeedEntry,
  RecommendationStatus,
} from "./types";

/**
 * Data-access facade. Picks the backend per request:
 *   - DATABASE_URL set     → Prisma + Postgres (real persistence)
 *   - DATABASE_URL missing → in-memory mock store (zero-setup default)
 * Call sites are async either way, so switching modes never touches the UI.
 */
export function storageMode(): "prisma" | "mock" {
  return process.env.DATABASE_URL ? "prisma" : "mock";
}

function repo(): Repository {
  return storageMode() === "prisma" ? prismaRepo : mockRepo;
}

export function listItems(): Promise<Item[]> {
  return repo().listItems();
}

export function getItem(id: string): Promise<Item | undefined> {
  return repo().getItem(id);
}

export function createItem(input: AgentInput): Promise<Item> {
  return repo().createItem(input);
}

export function updateItem(id: string, patch: Partial<Item>): Promise<Item | undefined> {
  return repo().updateItem(id, patch);
}

export function refreshInsight(id: string): Promise<Insight | undefined> {
  return repo().refreshInsight(id);
}

export function upsertListing(id: string, listing: Listing): Promise<Item | undefined> {
  return repo().upsertListing(id, listing);
}

export function setListingStatus(
  id: string,
  marketplace: MarketplaceId,
  status: ListingStatus,
): Promise<Item | undefined> {
  return repo().setListingStatus(id, marketplace, status);
}

export function listRecommendations(): Promise<RecommendationFeedEntry[]> {
  return repo().listRecommendations();
}

export function setRecommendationStatus(
  id: string,
  status: RecommendationStatus,
): Promise<Recommendation | undefined> {
  return repo().setRecommendationStatus(id, status);
}

export function refreshRecommendations(dryRun?: boolean): Promise<RefreshResult> {
  return repo().refreshRecommendations(dryRun);
}

export function addMetric(
  itemId: string,
  metric: Omit<MetricEntry, "id" | "createdAt">,
): Promise<Item | undefined> {
  return repo().addMetric(itemId, metric);
}

export function updateListingMeta(
  id: string,
  marketplace: MarketplaceId,
  patch: ListingMetaPatch,
): Promise<Item | undefined> {
  return repo().updateListingMeta(id, marketplace, patch);
}

export function startJobRun(jobName: string, dryRun: boolean): Promise<JobRun> {
  return repo().startJobRun(jobName, dryRun);
}

export function finishJobRun(id: string, patch: JobRunPatch): Promise<JobRun | undefined> {
  return repo().finishJobRun(id, patch);
}

export function listJobRuns(limit?: number): Promise<JobRun[]> {
  return repo().listJobRuns(limit);
}

export function saveAuditResults(findings: AuditFinding[]): Promise<number> {
  return repo().saveAuditResults(findings);
}

export function listAuditResults(limit?: number): Promise<AuditResult[]> {
  return repo().listAuditResults(limit);
}
