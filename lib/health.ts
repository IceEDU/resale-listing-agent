import type { Item } from "./types";

/**
 * Listing health score, 0 to 100.
 * Label mapping: 0-39 Poor, 40-69 Needs Work, 70-89 Good, 90-100 Strong.
 * Pure function of the item, so mock and Prisma modes score identically.
 */
export type HealthLabel = "Poor" | "Needs Work" | "Good" | "Strong";

export type Health = {
  score: number;
  label: HealthLabel;
  reasons: string[];
  fixes: string[];
};

function label(score: number): HealthLabel {
  if (score >= 90) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

function ageDays(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function healthScore(item: Item): Health {
  if (item.status === "sold") {
    return { score: 100, label: "Strong", reasons: ["Sold, nothing left to do"], fixes: [] };
  }

  let score = 0;
  const reasons: string[] = [];
  const fixes: string[] = [];

  const titleWords = item.title.trim().split(/\s+/).length;
  if (titleWords >= 4) {
    score += 15;
    reasons.push("Good keyword coverage");
  } else {
    fixes.push("Add more descriptive keywords to the title");
  }

  const brandInTitle =
    !!item.brand && item.title.toLowerCase().includes(item.brand.toLowerCase());
  if (brandInTitle) score += 5;
  else if (item.brand) fixes.push(`Title missing brand (${item.brand})`);
  if (/\d/.test(item.title)) {
    score += 10;
    reasons.push("Title includes a model number");
  } else {
    fixes.push("Title missing model number");
  }

  if (item.description.length >= 80) {
    score += 15;
    reasons.push("Detailed description");
  } else {
    fixes.push("Description is thin, add condition and measurements");
  }

  if (item.photos.length >= 3) {
    score += 15;
    reasons.push(`${item.photos.length} photos attached`);
  } else {
    fixes.push(
      `Only ${item.photos.length} photo${item.photos.length === 1 ? "" : "s"}, add at least 3`,
    );
  }

  score += 5;

  if (item.price >= item.insight.low && item.price <= item.insight.high) {
    score += 15;
    reasons.push("Price sits inside the suggested range");
  } else if (item.price > item.insight.high) {
    fixes.push("Price is above recommended range");
  } else {
    fixes.push("Price is below the suggested range, you may be leaving money on the table");
  }

  const posted = item.listings.filter(
    (l) => l.status === "active" || l.status === "assisted_posted",
  );
  if (posted.length >= 2) {
    score += 15;
    reasons.push(`Live on ${posted.length} marketplaces`);
  } else if (posted.length === 1) {
    score += 10;
    fixes.push("Only on one marketplace, cross-post to sell faster");
  } else {
    fixes.push("Not posted anywhere yet");
  }

  const oldestPost = posted
    .map((l) => (l.postedAt ? ageDays(l.postedAt) : 0))
    .reduce((a, b) => Math.max(a, b), 0);
  if (posted.length > 0 && oldestPost > Math.max(item.insight.daysToSell, 14)) {
    fixes.push("Listing is stale, consider reposting");
  } else {
    score += 10;
  }

  const latestMetric = item.metrics[item.metrics.length - 1];
  if (latestMetric && ageDays(latestMetric.createdAt) <= 7) {
    score += 5;
    reasons.push("Fresh marketplace stats on file");
  } else if (posted.length > 0) {
    fixes.push("No recent stats, log views and messages to sharpen advice");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, label: label(score), reasons, fixes };
}
