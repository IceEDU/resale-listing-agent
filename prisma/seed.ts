import { PrismaClient } from "@prisma/client";
import { DEFAULT_RULES } from "../lib/automation";
import { draftFingerprint } from "../lib/recommendations";
import { seedItems } from "../lib/repo/seed-data";
import type { Item } from "../lib/types";

const prisma = new PrismaClient();
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
type DbConfidence = "LOW" | "MEDIUM" | "HIGH";
type DbPriceSource = "AGENT" | "USER" | "CONNECTOR" | "MANUAL";
type DbRecType =
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
type DbRecPriority = "HIGH" | "MEDIUM" | "LOW";

const up = <T extends string>(v: string) => v.toUpperCase() as T;

async function createItem(userId: string, item: Item) {
  const created = await prisma.item.create({
    data: {
      userId,
      title: item.title,
      description: item.description,
      category: item.category,
      brand: item.brand,
      condition: up<DbCondition>(item.condition),
      price: item.price,
      status: up<DbItemStatus>(item.status),
      createdAt: new Date(item.createdAt),
      photos: {
        create: item.photos.map((p, i) => ({
          blobKey: `seed-${item.title.slice(0, 12)}-${i + 1}`,
          altText: p.alt,
          consentGrantedAt: new Date(p.consentGrantedAt),
        })),
      },
      listings: {
        create: item.listings.map((l) => ({
          marketplace: up<DbMarketplace>(l.marketplace),
          mode: up<DbListingMode>(l.mode),
          status: up<DbListingStatus>(l.status),
          postedAt: l.postedAt ? new Date(l.postedAt) : null,
        })),
      },
      insights: {
        create: {
          estimate: item.insight.estimate,
          rangeLow: item.insight.low,
          rangeHigh: item.insight.high,
          trend90dPct: item.insight.trend90dPct,
          sellabilityScore: item.insight.sellability,
          projectedDaysToSell: item.insight.daysToSell,
          confidence: up<DbConfidence>(item.insight.confidence),
          explanation: item.insight.explanation,
          compsCount: item.insight.compsCount,
        },
      },
      priceHistory: {
        create: item.priceHistory.map((p) => ({
          price: p.price,
          source: up<DbPriceSource>(p.source),
          reason: p.reason,
          marketplace: p.marketplace ? up<DbMarketplace>(p.marketplace) : null,
          createdAt: new Date(p.createdAt),
        })),
      },
      metrics: {
        create: item.metrics.map((m) => ({
          marketplace: m.marketplace ? up<DbMarketplace>(m.marketplace) : null,
          views: m.views,
          saves: m.saves,
          messages: m.messages,
          listingUrl: m.listingUrl ?? null,
          notes: m.notes ?? null,
          createdAt: new Date(m.createdAt),
        })),
      },
    },
  });

  for (const r of item.recommendations) {
    await prisma.recommendation.create({
      data: {
        itemId: created.id,
        marketplace: r.marketplace ? up<DbMarketplace>(r.marketplace) : null,
        type: up<DbRecType>(r.type),
        priority: up<DbRecPriority>(r.priority),
        message: r.message,
        suggestedAction: r.suggestedAction ?? undefined,
        status: "PENDING",
        fingerprint: draftFingerprint(created.id, r),
        createdAt: new Date(r.createdAt),
      },
    });
  }
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: { email: DEMO_USER_EMAIL },
  });

  await prisma.item.deleteMany({ where: { userId: user.id } });
  await prisma.automationRule.deleteMany({});

  for (const item of seedItems()) {
    await createItem(user.id, item);
  }

  for (const rule of DEFAULT_RULES) {
    await prisma.automationRule.create({
      data: {
        type: up<DbRecType>(rule.type),
        label: rule.label,
        description: rule.description,
        enabled: true,
        config: rule.config,
      },
    });
  }

  const items = await prisma.item.count();
  const recs = await prisma.recommendation.count();
  console.log(`Seeded ${items} demo items, ${recs} recommendations, ${DEFAULT_RULES.length} automation rules.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
