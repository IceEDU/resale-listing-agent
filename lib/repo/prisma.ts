import type { Prisma } from "@prisma/client";
import { agent } from "../agent";
import type { AgentInput, AgentListing, SellerAnswers } from "../agent/types";
import { prisma } from "../db";
import { generateInsight } from "../insights";
import { draftFingerprint, generateRecommendations } from "../recommendations";
import type {
  AuditFinding,
  AuditResult,
  AuditArea,
  AuditSeverity,
  Condition,
  Confidence,
  Insight,
  Item,
  ItemStatus,
  JobRun,
  JobStatus,
  Listing,
  ListingMode,
  ListingStatus,
  MarketplaceId,
  MetricEntry,
  PriceSource,
  Recommendation,
  RecommendationFeedEntry,
  RecommendationPriority,
  RecommendationStatus,
  RecommendationType,
} from "../types";
import type { JobRunPatch, ListingMetaPatch, RefreshResult, Repository } from "./types";

const DEMO_USER_EMAIL = "demo@listing.local";

type DbCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "FOR_PARTS";
type DbItemStatus = "DRAFT" | "ACTIVE" | "SOLD" | "STALE";
type DbListingStatus =
  | "DRAFT"
  | "READY"
  | "ASSISTED_POSTED"
  | "ACTIVE"
  | "SOLD"
  | "DELISTED";
type DbListingMode = "API" | "ASSISTED";
type DbMarketplace = "EBAY" | "ETSY" | "FACEBOOK" | "CRAIGSLIST" | "MERCARI" | "POSHMARK";
type DbRecommendationType =
  | "PRICE_DROP"
  | "REPOST"
  | "FIX_TITLE"
  | "FIX_PHOTOS"
  | "HOLD"
  | "REFRESH_KEYWORDS"
  | "REFRESH_LISTING"
  | "REPOST_ASSISTED"
  | "CHECK_MESSAGES"
  | "UPDATE_MANUAL_STATS";
type DbJobStatus = "RUNNING" | "SUCCESS" | "FAILED";
type DbAuditSeverity = "INFO" | "WARNING" | "ERROR";
type DbAuditArea =
  | "ITEM"
  | "LISTING"
  | "RECOMMENDATION"
  | "CONNECTOR"
  | "PRICE"
  | "PRIVACY"
  | "JOB";
type DbRecommendationStatus = "PENDING" | "ACCEPTED" | "DISMISSED" | "DONE";
type DbRecommendationPriority = "HIGH" | "MEDIUM" | "LOW";
type DbPriceSource = "AGENT" | "USER" | "CONNECTOR" | "MANUAL";

const up = <T extends string>(v: string) => v.toUpperCase() as T;
const down = <T extends string>(v: string) => v.toLowerCase() as T;

const itemInclude = {
  photos: { orderBy: { createdAt: "asc" } },
  listings: { orderBy: { createdAt: "asc" } },
  insights: { orderBy: { createdAt: "desc" }, take: 1 },
  priceHistory: { orderBy: { createdAt: "asc" } },
  metrics: { orderBy: { createdAt: "asc" } },
  recommendations: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.ItemInclude;

type DbItem = Prisma.ItemGetPayload<{ include: typeof itemInclude }>;

function toInsight(db: DbItem["insights"][number]): Insight {
  return {
    estimate: Number(db.estimate),
    low: Number(db.rangeLow),
    high: Number(db.rangeHigh),
    trend90dPct: db.trend90dPct,
    sellability: db.sellabilityScore,
    daysToSell: db.projectedDaysToSell,
    confidence: down<Confidence>(db.confidence),
    explanation: db.explanation,
    compsCount: db.compsCount,
  };
}

function toRecommendation(db: DbItem["recommendations"][number]): Recommendation {
  return {
    id: db.id,
    itemId: db.itemId,
    marketplace: db.marketplace ? down<MarketplaceId>(db.marketplace) : undefined,
    type: down<RecommendationType>(db.type),
    priority: down<RecommendationPriority>(db.priority),
    message: db.message,
    suggestedAction:
      (db.suggestedAction as { newPrice?: number } | null) ?? undefined,
    status: down<RecommendationStatus>(db.status),
    fingerprint: db.fingerprint,
    createdAt: db.createdAt.toISOString(),
  };
}

function toItem(db: DbItem): Item {
  const price = db.price ? Number(db.price) : 0;
  return {
    id: db.id,
    title: db.title,
    description: db.description,
    category: db.category,
    brand: db.brand ?? "",
    condition: down<Condition>(db.condition),
    price,
    status: down<ItemStatus>(db.status),
    createdAt: db.createdAt.toISOString(),
    photos: db.photos.map((p) => ({
      id: p.id,
      alt: p.altText,
      consentGrantedAt: p.consentGrantedAt.toISOString(),
    })),
    listings: db.listings.map(
      (l): Listing => ({
        marketplace: down<MarketplaceId>(l.marketplace),
        mode: down<ListingMode>(l.mode),
        status: down<ListingStatus>(l.status),
        externalUrl: l.externalUrl ?? undefined,
        note: l.note ?? undefined,
        postedAt: l.postedAt?.toISOString(),
        lastCheckedAt: l.lastCheckedAt?.toISOString(),
        lastRefreshedAt: l.lastRefreshedAt?.toISOString(),
        nextReviewAt: l.nextReviewAt?.toISOString(),
        manualStatusNote: l.manualStatusNote ?? undefined,
      }),
    ),
    insight: db.insights[0]
      ? toInsight(db.insights[0])
      : generateInsight(db.id, price || 50),
    agent: (db.agentData as AgentListing | null) ?? undefined,
    answers: (db.answers as SellerAnswers | null) ?? undefined,
    priceHistory: db.priceHistory.map((p) => ({
      id: p.id,
      price: Number(p.price),
      source: down<PriceSource>(p.source),
      reason: p.reason,
      marketplace: p.marketplace ? down<MarketplaceId>(p.marketplace) : undefined,
      createdAt: p.createdAt.toISOString(),
    })),
    metrics: db.metrics.map((m) => ({
      id: m.id,
      marketplace: m.marketplace ? down<MarketplaceId>(m.marketplace) : undefined,
      views: m.views,
      saves: m.saves,
      messages: m.messages,
      listingUrl: m.listingUrl ?? undefined,
      notes: m.notes ?? undefined,
      createdAt: m.createdAt.toISOString(),
    })),
    recommendations: db.recommendations.map(toRecommendation),
  };
}

function insightCreateData(insight: Insight) {
  return {
    estimate: insight.estimate,
    rangeLow: insight.low,
    rangeHigh: insight.high,
    trend90dPct: insight.trend90dPct,
    sellabilityScore: insight.sellability,
    projectedDaysToSell: insight.daysToSell,
    confidence: up<"LOW" | "MEDIUM" | "HIGH">(insight.confidence),
    explanation: insight.explanation,
    compsCount: insight.compsCount,
  };
}

async function demoUserId(): Promise<string> {
  const user = await prisma().user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: { email: DEMO_USER_EMAIL },
  });
  return user.id;
}

async function syncItemStatus(itemId: string): Promise<void> {
  const listings = await prisma().listing.findMany({ where: { itemId } });
  if (listings.some((l) => l.status === "ACTIVE" || l.status === "ASSISTED_POSTED")) {
    await prisma().item.update({ where: { id: itemId }, data: { status: "ACTIVE" } });
  }
}

async function findItem(id: string): Promise<Item | undefined> {
  const db = await prisma().item.findUnique({ where: { id }, include: itemInclude });
  return db ? toItem(db) : undefined;
}

/**
 * Fingerprint-deduplicated engine pass for one item: keep still-valid pending
 * recommendations, drop outdated ones, never recreate a dismissed fingerprint,
 * create only genuinely new suggestions.
 */
async function regenerateFor(
  id: string,
  dryRun = false,
): Promise<{ created: number; removed: number; pending: number }> {
  const item = await findItem(id);
  if (!item) return { created: 0, removed: 0, pending: 0 };
  const drafts = generateRecommendations(item).map((d) => ({
    draft: d,
    fingerprint: draftFingerprint(id, d),
  }));
  const draftFps = new Set(drafts.map((d) => d.fingerprint));
  const pendingExisting = item.recommendations.filter((r) => r.status === "pending");
  const outdated = pendingExisting.filter((r) => !draftFps.has(r.fingerprint));
  const blockedFps = new Set(
    item.recommendations
      .filter((r) => r.status === "pending" || r.status === "dismissed")
      .map((r) => r.fingerprint),
  );
  const toCreate = drafts.filter((d) => !blockedFps.has(d.fingerprint));

  if (!dryRun) {
    if (outdated.length > 0) {
      await prisma().recommendation.deleteMany({
        where: { id: { in: outdated.map((r) => r.id) } },
      });
    }
    for (const { draft: d, fingerprint } of toCreate) {
      await prisma().recommendation.create({
        data: {
          itemId: id,
          marketplace: d.marketplace ? up<DbMarketplace>(d.marketplace) : null,
          type: up<DbRecommendationType>(d.type),
          priority: up<DbRecommendationPriority>(d.priority),
          message: d.message,
          suggestedAction: (d.suggestedAction ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          status: "PENDING",
          fingerprint,
        },
      });
    }
  }

  const pending = pendingExisting.length - outdated.length + toCreate.length;
  return { created: toCreate.length, removed: outdated.length, pending };
}

async function recordPrice(
  itemId: string,
  price: number,
  source: DbPriceSource,
  reason: string,
): Promise<void> {
  await prisma().priceHistory.create({ data: { itemId, price, source, reason } });
}

export const prismaRepo: Repository = {
  async listItems(): Promise<Item[]> {
    const rows = await prisma().item.findMany({
      include: itemInclude,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toItem);
  },

  getItem: findItem,

  async createItem(input: AgentInput): Promise<Item> {
    const generated = await agent().generateListing(input);
    const userId = await demoUserId();
    const now = new Date();
    const created = await prisma().item.create({
      data: {
        userId,
        title: generated.item.title,
        description: generated.item.description,
        category: generated.item.category,
        brand: generated.item.brand,
        condition: up<DbCondition>(generated.item.condition),
        status: "DRAFT",
        agentData: generated as unknown as Prisma.InputJsonValue,
        answers: (input.answers ?? undefined) as Prisma.InputJsonValue | undefined,
        photos: {
          create: Array.from({ length: input.photoCount }, (_, i) => ({
            blobKey: `local-device-${i + 1}`,
            altText: generated.item.title,
            consentGrantedAt: now,
          })),
        },
      },
    });
    const insight = generateInsight(created.id, generated.pricing.strategy.realistic);
    await prisma().item.update({
      where: { id: created.id },
      data: {
        price: generated.pricing.recommended,
        insights: { create: insightCreateData(insight) },
      },
    });
    await recordPrice(
      created.id,
      generated.pricing.recommended,
      "AGENT",
      "Initial agent pricing",
    );
    await regenerateFor(created.id);
    return (await findItem(created.id))!;
  },

  async updateItem(id: string, patch: Partial<Item>): Promise<Item | undefined> {
    const before = await prisma().item.findUnique({ where: { id } });
    if (!before) return undefined;
    const data: Prisma.ItemUpdateInput = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.category !== undefined) data.category = patch.category;
    if (patch.brand !== undefined) data.brand = patch.brand;
    if (patch.condition !== undefined) data.condition = up<DbCondition>(patch.condition);
    if (patch.price !== undefined) data.price = patch.price;
    if (patch.status !== undefined) data.status = up<DbItemStatus>(patch.status);
    await prisma().item.update({ where: { id }, data });
    if (patch.price !== undefined && Number(before.price) !== patch.price) {
      await recordPrice(id, patch.price, "USER", "Manual price edit");
      await regenerateFor(id);
    }
    return findItem(id);
  },

  async refreshInsight(id: string): Promise<Insight | undefined> {
    const item = await prisma().item.findUnique({ where: { id } });
    if (!item) return undefined;
    const insight = generateInsight(
      `${id}-${Date.now()}`,
      item.price ? Number(item.price) : 50,
    );
    await prisma().pricingInsight.create({
      data: { itemId: id, ...insightCreateData(insight) },
    });
    return insight;
  },

  async upsertListing(id: string, listing: Listing): Promise<Item | undefined> {
    const exists = await prisma().item.findUnique({ where: { id } });
    if (!exists) return undefined;
    const marketplace = up<DbMarketplace>(listing.marketplace);
    const data = {
      mode: up<DbListingMode>(listing.mode),
      status: up<DbListingStatus>(listing.status),
      externalUrl: listing.externalUrl ?? null,
      note: listing.note ?? null,
      postedAt: listing.postedAt ? new Date(listing.postedAt) : null,
    };
    await prisma().listing.upsert({
      where: { itemId_marketplace: { itemId: id, marketplace } },
      update: data,
      create: { itemId: id, marketplace, ...data },
    });
    await syncItemStatus(id);
    await regenerateFor(id);
    return findItem(id);
  },

  async setListingStatus(
    id: string,
    marketplace: MarketplaceId,
    status: ListingStatus,
  ): Promise<Item | undefined> {
    try {
      await prisma().listing.update({
        where: {
          itemId_marketplace: { itemId: id, marketplace: up<DbMarketplace>(marketplace) },
        },
        data: {
          status: up<DbListingStatus>(status),
          ...(status === "active" || status === "assisted_posted" ? { postedAt: new Date() } : {}),
        },
      });
    } catch {
      return undefined;
    }
    await syncItemStatus(id);
    await regenerateFor(id);
    return findItem(id);
  },

  async listRecommendations(): Promise<RecommendationFeedEntry[]> {
    const rows = await prisma().recommendation.findMany({
      include: { item: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      ...toRecommendation(r as unknown as DbItem["recommendations"][number]),
      itemTitle: r.item.title,
      itemPrice: r.item.price ? Number(r.item.price) : 0,
    }));
  },

  async setRecommendationStatus(
    id: string,
    status: RecommendationStatus,
  ): Promise<Recommendation | undefined> {
    const rec = await prisma().recommendation.findUnique({ where: { id } });
    if (!rec) return undefined;
    const updated = await prisma().recommendation.update({
      where: { id },
      data: { status: up<DbRecommendationStatus>(status) },
    });
    const action = rec.suggestedAction as { newPrice?: number } | null;
    if (status === "accepted" && action?.newPrice) {
      await prisma().item.update({
        where: { id: rec.itemId },
        data: { price: action.newPrice },
      });
      await recordPrice(rec.itemId, action.newPrice, "USER", "Accepted recommendation");
    }
    return toRecommendation(updated as unknown as DbItem["recommendations"][number]);
  },

  async refreshRecommendations(dryRun = false): Promise<RefreshResult> {
    const items = await prisma().item.findMany({ select: { id: true } });
    let created = 0;
    let removed = 0;
    let pending = 0;
    for (const { id } of items) {
      const r = await regenerateFor(id, dryRun);
      created += r.created;
      removed += r.removed;
      pending += r.pending;
    }
    return { created, removed, pending };
  },

  async updateListingMeta(
    id: string,
    marketplace: MarketplaceId,
    patch: ListingMetaPatch,
  ): Promise<Item | undefined> {
    try {
      await prisma().listing.update({
        where: {
          itemId_marketplace: { itemId: id, marketplace: up<DbMarketplace>(marketplace) },
        },
        data: {
          ...(patch.postedAt !== undefined ? { postedAt: new Date(patch.postedAt) } : {}),
          ...(patch.lastCheckedAt !== undefined
            ? { lastCheckedAt: new Date(patch.lastCheckedAt) }
            : {}),
          ...(patch.lastRefreshedAt !== undefined
            ? { lastRefreshedAt: new Date(patch.lastRefreshedAt) }
            : {}),
          ...(patch.nextReviewAt !== undefined
            ? { nextReviewAt: new Date(patch.nextReviewAt) }
            : {}),
          ...(patch.manualStatusNote !== undefined
            ? { manualStatusNote: patch.manualStatusNote }
            : {}),
          ...(patch.externalUrl !== undefined ? { externalUrl: patch.externalUrl } : {}),
        },
      });
    } catch {
      return undefined;
    }
    await regenerateFor(id);
    return findItem(id);
  },

  async startJobRun(jobName: string, dryRun: boolean): Promise<JobRun> {
    const run = await prisma().jobRun.create({ data: { jobName, dryRun } });
    return {
      id: run.id,
      jobName: run.jobName,
      status: down<JobStatus>(run.status),
      startedAt: run.startedAt.toISOString(),
      summary: run.summary,
      dryRun: run.dryRun,
      createdRecommendations: run.createdRecommendations,
      updatedRecommendations: run.updatedRecommendations,
    };
  },

  async finishJobRun(id: string, patch: JobRunPatch): Promise<JobRun | undefined> {
    try {
      const run = await prisma().jobRun.update({
        where: { id },
        data: {
          status: up<DbJobStatus>(patch.status),
          summary: patch.summary,
          error: patch.error ?? null,
          finishedAt: new Date(),
          createdRecommendations: patch.createdRecommendations ?? 0,
          updatedRecommendations: patch.updatedRecommendations ?? 0,
        },
      });
      return {
        id: run.id,
        jobName: run.jobName,
        status: down<JobStatus>(run.status),
        startedAt: run.startedAt.toISOString(),
        finishedAt: run.finishedAt?.toISOString(),
        summary: run.summary,
        error: run.error ?? undefined,
        dryRun: run.dryRun,
        createdRecommendations: run.createdRecommendations,
        updatedRecommendations: run.updatedRecommendations,
      };
    } catch {
      return undefined;
    }
  },

  async listJobRuns(limit = 20): Promise<JobRun[]> {
    const runs = await prisma().jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return runs.map((run) => ({
      id: run.id,
      jobName: run.jobName,
      status: down<JobStatus>(run.status),
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString(),
      summary: run.summary,
      error: run.error ?? undefined,
      dryRun: run.dryRun,
      createdRecommendations: run.createdRecommendations,
      updatedRecommendations: run.updatedRecommendations,
    }));
  },

  async saveAuditResults(findings: AuditFinding[]): Promise<number> {
    await prisma().selfAuditResult.updateMany({
      where: { resolved: false },
      data: { resolved: true, resolvedAt: new Date() },
    });
    for (const f of findings) {
      await prisma().selfAuditResult.create({
        data: {
          severity: up<DbAuditSeverity>(f.severity),
          area: up<DbAuditArea>(f.area),
          message: f.message,
          entityType: f.entityType,
          entityId: f.entityId ?? null,
        },
      });
    }
    return findings.length;
  },

  async listAuditResults(limit = 50): Promise<AuditResult[]> {
    const rows = await prisma().selfAuditResult.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      severity: down<AuditSeverity>(r.severity),
      area: down<AuditArea>(r.area),
      message: r.message,
      entityType: r.entityType,
      entityId: r.entityId ?? undefined,
      resolved: r.resolved,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString(),
    }));
  },

  async addMetric(
    itemId: string,
    metric: Omit<MetricEntry, "id" | "createdAt">,
  ): Promise<Item | undefined> {
    const exists = await prisma().item.findUnique({ where: { id: itemId } });
    if (!exists) return undefined;
    await prisma().listingMetric.create({
      data: {
        itemId,
        marketplace: metric.marketplace ? up<DbMarketplace>(metric.marketplace) : null,
        views: metric.views,
        saves: metric.saves,
        messages: metric.messages,
        listingUrl: metric.listingUrl ?? null,
        notes: metric.notes ?? null,
      },
    });
    await regenerateFor(itemId);
    return findItem(itemId);
  },
};
