import type { ConnectorResult, DraftListing, MarketplaceConnector } from "./types";

/**
 * Stub for the eBay Sell APIs (documented public endpoints only):
 *   1. createOrReplaceInventoryItem  (Sell Inventory API)
 *   2. createOffer + publishOffer    (Sell Inventory API)
 *   3. Browse API for active comps; Marketplace Insights API (limited
 *      access, requires eBay approval) for sold comps.
 * No network calls are made until credentials are configured.
 */
export const ebayConnector: MarketplaceConnector = {
  id: "ebay",
  label: "eBay",
  mode: "api",

  isConfigured() {
    return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
  },

  async createListing(draft: DraftListing): Promise<ConnectorResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        status: "draft",
        note: "eBay connector not configured. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET, then complete the OAuth consent flow.",
      };
    }
    return {
      ok: true,
      status: "ready",
      externalId: `ebay-stub-${Date.now()}`,
      note: `Stub: would publish "${draft.title}" at $${draft.price} via Sell Inventory API (createOrReplaceInventoryItem → createOffer → publishOffer).`,
    };
  },

  async endListing(externalId: string): Promise<ConnectorResult> {
    return {
      ok: true,
      status: "delisted",
      externalId,
      note: "Stub: would call withdrawOffer / endItem.",
    };
  },

  async getStatus(): Promise<"draft"> {
    return "draft";
  },
};
