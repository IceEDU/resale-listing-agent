import { generateInsight } from "../insights";
import { draftFingerprint, generateRecommendations } from "../recommendations";
import type { Item, Listing, MetricEntry, PricePoint } from "../types";
import { mockVision } from "../vision";

/**
 * Demo data shared by the in-memory store seed and prisma/seed.ts.
 * Four deliberate scenarios for the recommendation feed:
 *   1. DeWalt saw: quiet after 6 days, needs a price drop
 *   2. Makita compressor: 4 weeks old on Facebook, needs a repost
 *   3. Trek bike: recent buyer messages, hold the price
 *   4. UDM drill: weak title and one photo, fix before pricing moves
 */
export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

type SeedOptions = {
  status: Item["status"];
  createdDaysAgo: number;
  listings: Listing[];
  price?: number;
  photoCount?: number;
  metrics?: Omit<MetricEntry, "id">[];
  priceHistory?: Omit<PricePoint, "id">[];
};

export function buildSeedItem(id: string, hint: string, opts: SeedOptions): Item {
  const vision = mockVision(hint, 1);
  const insight = generateInsight(id, vision.basePrice);
  const created = daysAgo(opts.createdDaysAgo);
  const photoCount = opts.photoCount ?? 3;
  const price = opts.price ?? insight.estimate;

  const item: Item = {
    id,
    title: vision.title,
    description: vision.description,
    category: vision.category,
    brand: vision.brand,
    condition: vision.condition,
    price,
    status: opts.status,
    createdAt: created,
    photos: Array.from({ length: photoCount }, (_, i) => ({
      id: `${id}-p${i + 1}`,
      alt: vision.title,
      consentGrantedAt: created,
    })),
    listings: opts.listings,
    insight,
    priceHistory: (
      opts.priceHistory ?? [
        {
          price,
          source: "agent" as const,
          reason: "Initial agent pricing",
          createdAt: created,
        },
      ]
    ).map((p, i) => ({ ...p, id: `${id}-ph${i + 1}` })),
    metrics: (opts.metrics ?? []).map((m, i) => ({ ...m, id: `${id}-m${i + 1}` })),
    recommendations: [],
  };

  item.recommendations = generateRecommendations(item).map((d, i) => ({
    ...d,
    id: `${id}-r${i + 1}`,
    itemId: id,
    status: "pending" as const,
    fingerprint: draftFingerprint(id, d),
    createdAt: daysAgo(0),
  }));
  return item;
}

export function seedItems(): Item[] {
  return [
    buildSeedItem("itm_dewalt", "DeWalt DWE575 circular saw", {
      status: "active",
      createdDaysAgo: 7,
      price: 125,
      photoCount: 4,
      listings: [
        {
          marketplace: "facebook",
          mode: "assisted",
          status: "assisted_posted",
          postedAt: daysAgo(6),
        },
      ],
      metrics: [
        { marketplace: "facebook", views: 30, saves: 2, messages: 0, createdAt: daysAgo(1) },
      ],
      priceHistory: [
        { price: 139, source: "agent", reason: "Initial agent pricing", createdAt: daysAgo(7) },
        {
          price: 125,
          source: "user",
          reason: "Matched local competition",
          createdAt: daysAgo(5),
        },
      ],
    }),
    buildSeedItem("itm_makita", "Makita MAC2400 air compressor", {
      status: "stale",
      createdDaysAgo: 29,
      photoCount: 3,
      listings: [
        {
          marketplace: "facebook",
          mode: "assisted",
          status: "assisted_posted",
          postedAt: daysAgo(28),
        },
      ],
      metrics: [
        { marketplace: "facebook", views: 3, saves: 0, messages: 0, createdAt: daysAgo(1) },
      ],
    }),
    buildSeedItem("itm_trek", "Trek FX 2 hybrid bike, size M", {
      status: "active",
      createdDaysAgo: 9,
      photoCount: 5,
      listings: [
        {
          marketplace: "facebook",
          mode: "assisted",
          status: "assisted_posted",
          postedAt: daysAgo(8),
        },
        { marketplace: "ebay", mode: "api", status: "active", postedAt: daysAgo(8) },
      ],
      metrics: [
        {
          marketplace: "facebook",
          views: 22,
          saves: 4,
          messages: 5,
          notes: "Two buyers asking about pickup this weekend",
          createdAt: daysAgo(1),
        },
      ],
    }),
    buildSeedItem("itm_udm", "UDM power drill", {
      status: "active",
      createdDaysAgo: 6,
      photoCount: 1,
      listings: [
        {
          marketplace: "facebook",
          mode: "assisted",
          status: "assisted_posted",
          postedAt: daysAgo(6),
        },
      ],
      metrics: [
        { marketplace: "facebook", views: 2, saves: 0, messages: 0, createdAt: daysAgo(2) },
      ],
    }),
  ];
}
