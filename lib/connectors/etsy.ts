import type { ConnectorResult, DraftListing, MarketplaceConnector } from "./types";

/**
 * Stub for the Etsy Open API v3 (documented public endpoints only):
 *   createDraftListing → uploadListingImage → updateListing(state: active).
 * No network calls are made until credentials are configured.
 */
export const etsyConnector: MarketplaceConnector = {
  id: "etsy",
  label: "Etsy",
  mode: "api",

  isConfigured() {
    return Boolean(process.env.ETSY_KEYSTRING && process.env.ETSY_SHARED_SECRET);
  },

  async createListing(draft: DraftListing): Promise<ConnectorResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        status: "draft",
        note: "Etsy connector not configured. Set ETSY_KEYSTRING and ETSY_SHARED_SECRET, then complete the OAuth consent flow.",
      };
    }
    return {
      ok: true,
      status: "ready",
      externalId: `etsy-stub-${Date.now()}`,
      note: `Stub: would create a draft listing for "${draft.title}" at $${draft.price} via Open API v3 createDraftListing.`,
    };
  },

  async endListing(externalId: string): Promise<ConnectorResult> {
    return {
      ok: true,
      status: "delisted",
      externalId,
      note: "Stub: would call updateListing(state: inactive).",
    };
  },

  async getStatus(): Promise<"draft"> {
    return "draft";
  },
};
