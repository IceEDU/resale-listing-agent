import { LISTING_STATUS_LABELS, type Listing, type MarketplaceId } from "@/lib/types";

const MARKETPLACE_META: Record<MarketplaceId, { short: string; classes: string }> = {
  ebay: { short: "eBay", classes: "bg-amber-400/10 text-amber-300" },
  etsy: { short: "Etsy", classes: "bg-orange-400/10 text-orange-300" },
  facebook: { short: "FB", classes: "bg-blue-400/10 text-blue-300" },
  craigslist: { short: "CL", classes: "bg-purple-400/10 text-purple-300" },
  mercari: { short: "Mercari", classes: "bg-rose-400/10 text-rose-300" },
  poshmark: { short: "Posh", classes: "bg-pink-400/10 text-pink-300" },
};

export default function MarketplaceStatusChip({ listing }: { listing: Listing }) {
  const meta = MARKETPLACE_META[listing.marketplace];
  return (
    <span className={`chip ${meta.classes}`}>
      {meta.short} · {LISTING_STATUS_LABELS[listing.status]}
    </span>
  );
}
