import type { Item, ListingMode, MarketplaceId } from "../types";
import { ASSISTED_TARGETS, isAssisted } from "./assisted";
import { ebayConnector } from "./ebay";
import { etsyConnector } from "./etsy";
import type { DraftListing, MarketplaceConnector } from "./types";

export const API_CONNECTORS: Record<"ebay" | "etsy", MarketplaceConnector> = {
  ebay: ebayConnector,
  etsy: etsyConnector,
};

export type MarketplaceOption = {
  id: MarketplaceId;
  label: string;
  mode: ListingMode;
  blurb: string;
  configured: boolean;
};

export function marketplaceOptions(): MarketplaceOption[] {
  const api: MarketplaceOption[] = (["ebay", "etsy"] as const).map((id) => ({
    id,
    label: API_CONNECTORS[id].label,
    mode: "api",
    blurb: API_CONNECTORS[id].isConfigured()
      ? "Posts automatically"
      : "Posts automatically (connector not configured — will save a draft)",
    configured: API_CONNECTORS[id].isConfigured(),
  }));
  const assisted: MarketplaceOption[] = (
    Object.entries(ASSISTED_TARGETS) as [MarketplaceId, { label: string }][]
  ).map(([id, t]) => ({
    id,
    label: t.label,
    mode: "assisted",
    blurb: "Opens a pre-filled draft — you tap Post",
    configured: true,
  }));
  return [...api, ...assisted];
}

export function toDraftListing(item: Item): DraftListing {
  return {
    title: item.title,
    description: item.description,
    price: item.price,
    condition: item.condition,
    category: item.category,
    photoAlts: item.photos.map((p) => p.alt),
  };
}

export { isAssisted };
