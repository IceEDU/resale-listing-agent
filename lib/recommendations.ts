import type {
  Item,
  MarketplaceId,
  Recommendation,
  RecommendationPriority,
  RecommendationType,
} from "./types";

/**
 * Recommendation engine. Pure function: (item, now) -> drafts.
 * Reads health signals, listing age, price history headroom, and manual
 * marketplace stats. Repositories persist the drafts as pending
 * recommendations; nothing executes without the user accepting it.
 *
 * Duplicate prevention: every draft gets a deterministic fingerprint from
 * (itemId, marketplace, type, message, suggestedAction). Repositories keep an
 * existing pending recommendation with the same fingerprint instead of
 * recreating it, and never recreate a dismissed fingerprint. When the item
 * state changes materially (price, age in weeks, metrics), the message or
 * action changes, the fingerprint changes, and the suggestion can return.
 */
export type RecommendationDraft = {
  type: RecommendationType;
  priority: RecommendationPriority;
  message: string;
  marketplace?: MarketplaceId;
  suggestedAction?: { newPrice?: number };
};

export function draftFingerprint(itemId: string, d: RecommendationDraft): string {
  const raw = `${itemId}|${d.marketplace ?? ""}|${d.type}|${d.message}|${JSON.stringify(d.suggestedAction ?? {})}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
  return `fp_${Math.abs(h).toString(36)}`;
}

function ageDays(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}

/** "DeWalt DWE575 circular saw" with brand "DeWalt" -> "DeWalt saw" */
function shortName(item: Item): string {
  const words = item.title.trim().split(/\s+/);
  const last = words[words.length - 1];
  if (item.brand && last && last.toLowerCase() !== item.brand.toLowerCase()) {
    return `${item.brand} ${last.toLowerCase()}`;
  }
  return item.title;
}

export function itemFloor(item: Item): number {
  return item.agent?.pricing.strategy.floor ?? Math.round(item.insight.low * 0.75);
}

export function generateRecommendations(item: Item, now = Date.now()): RecommendationDraft[] {
  if (item.status === "sold") return [];

  const drafts: RecommendationDraft[] = [];
  const floor = itemFloor(item);

  const weakTitle = !!item.brand && !/\d/.test(item.title);
  const fixes: RecommendationDraft[] = [];
  if (weakTitle) {
    fixes.push({
      type: "fix_title",
      priority: "medium",
      message: `Add model number to ${item.brand} title`,
    });
  }
  if (item.photos.length < 3) {
    fixes.push({
      type: "fix_photos",
      priority: "medium",
      message: "Add 3 more photos before lowering price",
    });
  }
  drafts.push(...fixes);

  const latestMetric = [...item.metrics].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  const recentMessages =
    !!latestMetric &&
    latestMetric.messages > 0 &&
    ageDays(latestMetric.createdAt, now) <= 7;

  const posted = item.listings.filter(
    (l) => l.status === "active" || l.status === "assisted_posted",
  );
  const fb = posted.find((l) => l.marketplace === "facebook");
  const fbAge = fb?.postedAt ? ageDays(fb.postedAt, now) : undefined;
  const fbStale =
    fbAge !== undefined &&
    fbAge >= 14 &&
    (!fb?.lastRefreshedAt || ageDays(fb.lastRefreshedAt, now) >= 14);
  const oldestPostAge = posted
    .map((l) => (l.postedAt ? ageDays(l.postedAt, now) : 0))
    .reduce((a, b) => Math.max(a, b), 0);

  if (recentMessages) {
    drafts.push({
      type: "hold",
      priority: "low",
      message: "Hold price, recent messages suggest demand",
    });
    drafts.push({
      type: "check_messages",
      priority: "medium",
      marketplace: latestMetric?.marketplace,
      message:
        latestMetric?.marketplace === "facebook"
          ? "Check Facebook messages, buyers may be waiting"
          : "Check marketplace messages, buyers may be waiting",
    });
  } else if (fixes.length === 0 && posted.length > 0) {
    if (fbStale) {
      drafts.push({
        type: "repost_assisted",
        priority: "medium",
        marketplace: "facebook",
        message: `Repost ${shortName(item)}, listed ${Math.floor(fbAge! / 7)} weeks ago`,
      });
      const repostTarget = Math.max(item.agent?.pricing.strategy.fastSale ?? floor, floor);
      if (repostTarget < item.price) {
        drafts.push({
          type: "price_drop",
          priority: "high",
          marketplace: "facebook",
          message: `Drop price from $${item.price} to $${repostTarget} before reposting`,
          suggestedAction: { newPrice: repostTarget },
        });
      }
    } else if (oldestPostAge >= 5 && (!latestMetric || latestMetric.messages === 0)) {
      const newPrice = Math.max(Math.round(item.price * 0.92), floor);
      if (newPrice < item.price) {
        drafts.push({
          type: "price_drop",
          priority: "high",
          marketplace: fb?.marketplace ?? posted[0]?.marketplace,
          message: `Drop ${shortName(item)} from $${item.price} to $${newPrice}`,
          suggestedAction: { newPrice },
        });
      }
    }
  }

  if (weakTitle && fbStale) {
    drafts.push({
      type: "refresh_listing",
      priority: "medium",
      marketplace: "facebook",
      message: "Refresh title before reposting",
    });
  }

  if (fixes.length === 0 && !recentMessages && fb && latestMetric && latestMetric.views < 10) {
    drafts.push({
      type: "refresh_keywords",
      priority: "low",
      marketplace: "facebook",
      message: "Facebook has low views; refresh title keywords",
    });
  }

  if (
    posted.length > 0 &&
    (!latestMetric || ageDays(latestMetric.createdAt, now) > 7)
  ) {
    drafts.push({
      type: "update_manual_stats",
      priority: "low",
      message: "Log fresh views and messages to sharpen advice",
    });
  }

  return drafts;
}

export function pendingSorted(recommendations: Recommendation[]): Recommendation[] {
  const order: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
  return [...recommendations]
    .filter((r) => r.status === "pending")
    .sort((a, b) => order[a.priority] - order[b.priority]);
}
