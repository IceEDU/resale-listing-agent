import { API_CONNECTORS } from "../connectors";
import { itemFloor } from "../recommendations";
import type { AuditFinding, Item } from "../types";

const STALE_AUDIT_DAYS = 21;

function ageDays(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Self-check over the app's own data. Pure function of the item set so mock
 * and Prisma modes audit identically; the caller persists the findings.
 * Every check maps to a promise the app makes to the user: honest connector
 * status, price floors respected, consent recorded, data consistent.
 */
export function runSelfAudit(items: Item[]): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const item of items) {
    const posted = item.listings.filter(
      (l) => l.status === "active" || l.status === "assisted_posted",
    );
    const floor = itemFloor(item);

    if (posted.length > 0 && item.priceHistory.length === 0) {
      findings.push({
        severity: "warning",
        area: "price",
        message: `"${item.title}" is listed but has no price history`,
        entityType: "item",
        entityId: item.id,
      });
    }

    for (const photo of item.photos) {
      if (!photo.consentGrantedAt) {
        findings.push({
          severity: "error",
          area: "privacy",
          message: `Photo on "${item.title}" has no consent timestamp`,
          entityType: "photo",
          entityId: photo.id,
        });
      }
    }

    for (const listing of item.listings) {
      const live = listing.status === "active" || listing.status === "assisted_posted";

      if (listing.mode === "assisted" && live && listing.postedAt) {
        const freshness = listing.lastRefreshedAt ?? listing.postedAt;
        if (ageDays(freshness) >= STALE_AUDIT_DAYS) {
          findings.push({
            severity: "warning",
            area: "listing",
            message: `"${item.title}" on ${listing.marketplace} is ${ageDays(freshness)} days old without a refresh`,
            entityType: "listing",
            entityId: `${item.id}:${listing.marketplace}`,
          });
        }
      }

      if (listing.mode === "api" && listing.status === "assisted_posted") {
        findings.push({
          severity: "error",
          area: "listing",
          message: `API listing on ${listing.marketplace} has an assisted-only status`,
          entityType: "listing",
          entityId: `${item.id}:${listing.marketplace}`,
        });
      }

      if (listing.mode === "api" && live) {
        const connector = API_CONNECTORS[listing.marketplace as "ebay" | "etsy"];
        if (connector && !connector.isConfigured()) {
          findings.push({
            severity: "error",
            area: "connector",
            message: `"${item.title}" is marked ${listing.status} on ${listing.marketplace} but the connector is not configured; a real listing cannot exist`,
            entityType: "listing",
            entityId: `${item.id}:${listing.marketplace}`,
          });
        }
      }

      if (
        listing.mode === "assisted" &&
        live &&
        !listing.externalUrl &&
        !listing.manualStatusNote &&
        !item.metrics.some((m) => m.listingUrl)
      ) {
        findings.push({
          severity: "info",
          area: "listing",
          message: `"${item.title}" on ${listing.marketplace} has no listing URL or manual note on file`,
          entityType: "listing",
          entityId: `${item.id}:${listing.marketplace}`,
        });
      }
    }

    for (const rec of item.recommendations) {
      const newPrice = rec.suggestedAction?.newPrice;
      if (rec.status === "pending" && rec.type === "price_drop" && newPrice !== undefined) {
        if (newPrice < floor) {
          findings.push({
            severity: "error",
            area: "price",
            message: `Pending suggestion would price "${item.title}" at $${newPrice}, below the $${floor} floor`,
            entityType: "recommendation",
            entityId: rec.id,
          });
        }
      }
      if (rec.status === "accepted" && newPrice !== undefined) {
        const recorded = item.priceHistory.some(
          (p) => p.price === newPrice && p.createdAt >= rec.createdAt,
        );
        if (!recorded) {
          findings.push({
            severity: "warning",
            area: "recommendation",
            message: `Accepted price change to $${newPrice} on "${item.title}" has no matching price history entry`,
            entityType: "recommendation",
            entityId: rec.id,
          });
        }
      }
    }
  }

  return findings;
}
