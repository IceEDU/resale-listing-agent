import { agent } from "../agent";
import type { AgentInput } from "../agent/types";
import { generateInsight } from "../insights";
import { draftFingerprint, generateRecommendations } from "../recommendations";
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
} from "../types";
import { seedItems } from "./seed-data";
import type { JobRunPatch, ListingMetaPatch, RefreshResult, Repository } from "./types";

/**
 * In-memory implementation, the default when DATABASE_URL is missing so the
 * scaffold runs with zero setup. Data resets when the dev server restarts.
 */
type Store = { items: Map<string, Item>; jobRuns: JobRun[]; auditResults: AuditResult[] };

const g = globalThis as unknown as { __listingAgentStore?: Store };

function store(): Store {
  if (!g.__listingAgentStore) {
    const items = new Map<string, Item>();
    for (const item of seedItems()) items.set(item.id, item);
    g.__listingAgentStore = { items, jobRuns: [], auditResults: [] };
  }
  return g.__listingAgentStore;
}

function deriveStatus(listings: Listing[], fallback: Item["status"]): Item["status"] {
  return listings.some((l) => l.status === "active" || l.status === "assisted_posted")
    ? "active"
    : fallback;
}

function rid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Fingerprint-deduplicated regeneration: keep pending recommendations whose
 * fingerprint still applies, drop the rest, never recreate a dismissed
 * fingerprint, only create genuinely new suggestions.
 */
function regenerate(item: Item): { item: Item; created: number; removed: number } {
  const drafts = generateRecommendations(item).map((d) => ({
    draft: d,
    fingerprint: draftFingerprint(item.id, d),
  }));
  const draftFps = new Set(drafts.map((d) => d.fingerprint));
  const keptPending = item.recommendations.filter(
    (r) => r.status === "pending" && draftFps.has(r.fingerprint),
  );
  const nonPending = item.recommendations.filter((r) => r.status !== "pending");
  const removed = item.recommendations.filter(
    (r) => r.status === "pending" && !draftFps.has(r.fingerprint),
  ).length;
  const blockedFps = new Set(
    [...keptPending, ...nonPending.filter((r) => r.status === "dismissed")].map(
      (r) => r.fingerprint,
    ),
  );
  const fresh: Recommendation[] = drafts
    .filter((d) => !blockedFps.has(d.fingerprint))
    .map((d) => ({
      ...d.draft,
      id: `rec_${rid()}`,
      itemId: item.id,
      status: "pending" as const,
      fingerprint: d.fingerprint,
      createdAt: new Date().toISOString(),
    }));
  return {
    item: { ...item, recommendations: [...nonPending, ...keptPending, ...fresh] },
    created: fresh.length,
    removed,
  };
}

function regenerated(item: Item): Item {
  return regenerate(item).item;
}

export const mockRepo: Repository = {
  async listItems(): Promise<Item[]> {
    return [...store().items.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  },

  async getItem(id: string): Promise<Item | undefined> {
    return store().items.get(id);
  },

  async createItem(input: AgentInput): Promise<Item> {
    const id = `itm_${rid()}`;
    const generated = await agent().generateListing(input);
    const insight = generateInsight(id, generated.pricing.strategy.realistic);
    const now = new Date().toISOString();
    let item: Item = {
      id,
      title: generated.item.title,
      description: generated.item.description,
      category: generated.item.category,
      brand: generated.item.brand,
      condition: generated.item.condition,
      price: generated.pricing.recommended,
      status: "draft",
      createdAt: now,
      photos: Array.from({ length: input.photoCount }, (_, i) => ({
        id: `${id}-p${i + 1}`,
        alt: generated.item.title,
        consentGrantedAt: now,
      })),
      listings: [],
      insight,
      agent: generated,
      answers: input.answers,
      priceHistory: [
        {
          id: `${id}-ph1`,
          price: generated.pricing.recommended,
          source: "agent",
          reason: "Initial agent pricing",
          createdAt: now,
        },
      ],
      metrics: [],
      recommendations: [],
    };
    item = regenerated(item);
    store().items.set(id, item);
    return item;
  },

  async updateItem(id: string, patch: Partial<Item>): Promise<Item | undefined> {
    const item = store().items.get(id);
    if (!item) return undefined;
    let updated: Item = { ...item, ...patch, id: item.id };
    if (patch.price !== undefined && patch.price !== item.price) {
      updated.priceHistory = [
        ...item.priceHistory,
        {
          id: `ph_${rid()}`,
          price: patch.price,
          source: "user",
          reason: "Manual price edit",
          createdAt: new Date().toISOString(),
        },
      ];
      updated = regenerated(updated);
    }
    store().items.set(id, updated);
    return updated;
  },

  async refreshInsight(id: string): Promise<Insight | undefined> {
    const item = store().items.get(id);
    if (!item) return undefined;
    const insight = generateInsight(
      `${id}-${Date.now()}`,
      item.price || item.insight.estimate,
    );
    store().items.set(id, { ...item, insight });
    return insight;
  },

  async upsertListing(id: string, listing: Listing): Promise<Item | undefined> {
    const item = store().items.get(id);
    if (!item) return undefined;
    const rest = item.listings.filter((l) => l.marketplace !== listing.marketplace);
    const listings = [...rest, listing];
    const updated = regenerated({
      ...item,
      listings,
      status: deriveStatus(listings, item.status),
    });
    store().items.set(id, updated);
    return updated;
  },

  async setListingStatus(
    id: string,
    marketplace: MarketplaceId,
    status: ListingStatus,
  ): Promise<Item | undefined> {
    const item = store().items.get(id);
    if (!item) return undefined;
    const listings = item.listings.map((l) =>
      l.marketplace === marketplace
        ? {
            ...l,
            status,
            postedAt: status === "active" ? new Date().toISOString() : l.postedAt,
          }
        : l,
    );
    const updated = regenerated({
      ...item,
      listings,
      status: deriveStatus(listings, item.status),
    });
    store().items.set(id, updated);
    return updated;
  },

  async listRecommendations(): Promise<RecommendationFeedEntry[]> {
    const entries: RecommendationFeedEntry[] = [];
    for (const item of store().items.values()) {
      for (const rec of item.recommendations) {
        entries.push({ ...rec, itemTitle: item.title, itemPrice: item.price });
      }
    }
    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async setRecommendationStatus(
    id: string,
    status: RecommendationStatus,
  ): Promise<Recommendation | undefined> {
    for (const item of store().items.values()) {
      const rec = item.recommendations.find((r) => r.id === id);
      if (!rec) continue;
      const updatedRec: Recommendation = { ...rec, status };
      let updated: Item = {
        ...item,
        recommendations: item.recommendations.map((r) => (r.id === id ? updatedRec : r)),
      };
      if (status === "accepted" && rec.suggestedAction?.newPrice) {
        updated.price = rec.suggestedAction.newPrice;
        updated.priceHistory = [
          ...updated.priceHistory,
          {
            id: `ph_${rid()}`,
            price: rec.suggestedAction.newPrice,
            source: "user",
            reason: "Accepted recommendation",
            createdAt: new Date().toISOString(),
          },
        ];
      }
      store().items.set(item.id, updated);
      return updatedRec;
    }
    return undefined;
  },

  async refreshRecommendations(dryRun = false): Promise<RefreshResult> {
    let created = 0;
    let removed = 0;
    let pending = 0;
    for (const item of store().items.values()) {
      const result = regenerate(item);
      created += result.created;
      removed += result.removed;
      pending += result.item.recommendations.filter((r) => r.status === "pending").length;
      if (!dryRun) store().items.set(item.id, result.item);
    }
    return { created, removed, pending };
  },

  async addMetric(
    itemId: string,
    metric: Omit<MetricEntry, "id" | "createdAt">,
  ): Promise<Item | undefined> {
    const item = store().items.get(itemId);
    if (!item) return undefined;
    const metrics = [
      ...item.metrics,
      { ...metric, id: `m_${rid()}`, createdAt: new Date().toISOString() },
    ];
    const updated = regenerated({ ...item, metrics });
    store().items.set(itemId, updated);
    return updated;
  },

  async updateListingMeta(
    id: string,
    marketplace: MarketplaceId,
    patch: ListingMetaPatch,
  ): Promise<Item | undefined> {
    const item = store().items.get(id);
    if (!item) return undefined;
    if (!item.listings.some((l) => l.marketplace === marketplace)) return undefined;
    const listings = item.listings.map((l) =>
      l.marketplace === marketplace ? { ...l, ...patch } : l,
    );
    const updated = regenerated({ ...item, listings });
    store().items.set(id, updated);
    return updated;
  },

  async startJobRun(jobName: string, dryRun: boolean): Promise<JobRun> {
    const run: JobRun = {
      id: `job_${rid()}`,
      jobName,
      status: "running",
      startedAt: new Date().toISOString(),
      summary: "",
      dryRun,
      createdRecommendations: 0,
      updatedRecommendations: 0,
    };
    store().jobRuns.unshift(run);
    return run;
  },

  async finishJobRun(id: string, patch: JobRunPatch): Promise<JobRun | undefined> {
    const run = store().jobRuns.find((r) => r.id === id);
    if (!run) return undefined;
    run.status = patch.status;
    run.summary = patch.summary;
    run.error = patch.error;
    run.finishedAt = new Date().toISOString();
    run.createdRecommendations = patch.createdRecommendations ?? 0;
    run.updatedRecommendations = patch.updatedRecommendations ?? 0;
    return run;
  },

  async listJobRuns(limit = 20): Promise<JobRun[]> {
    return store().jobRuns.slice(0, limit);
  },

  async saveAuditResults(findings: AuditFinding[]): Promise<number> {
    const now = new Date().toISOString();
    for (const result of store().auditResults) {
      if (!result.resolved) {
        result.resolved = true;
        result.resolvedAt = now;
      }
    }
    for (const finding of findings) {
      store().auditResults.unshift({
        ...finding,
        id: `aud_${rid()}`,
        resolved: false,
        createdAt: now,
      });
    }
    return findings.length;
  },

  async listAuditResults(limit = 50): Promise<AuditResult[]> {
    return store().auditResults.slice(0, limit);
  },
};
