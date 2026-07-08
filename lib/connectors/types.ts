import type { ListingMode, ListingStatus, MarketplaceId } from "../types";

export type DraftListing = {
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  photoAlts: string[];
};

export type ConnectorResult = {
  ok: boolean;
  status: ListingStatus;
  externalId?: string;
  externalUrl?: string;
  note: string;
};

/**
 * Common interface every marketplace adapter implements (DESIGN.md §1, §5).
 * API-mode connectors talk to documented public endpoints only.
 * Assisted-mode connectors never automate the target site — they prepare a
 * draft the user posts manually.
 */
export interface MarketplaceConnector {
  id: MarketplaceId;
  label: string;
  mode: ListingMode;
  isConfigured(): boolean;
  createListing(draft: DraftListing): Promise<ConnectorResult>;
  endListing(externalId: string): Promise<ConnectorResult>;
  getStatus(externalId: string): Promise<ListingStatus>;
}
