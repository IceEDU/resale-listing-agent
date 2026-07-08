import Link from "next/link";
import { notFound } from "next/navigation";
import ActivityTimeline from "@/components/ActivityTimeline";
import ItemForm from "@/components/ItemForm";
import ListingHealthScore from "@/components/ListingHealthScore";
import ManualStatsForm from "@/components/ManualStatsForm";
import MarketplaceStatusChip from "@/components/MarketplaceStatusChip";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import PricingInsightPanel from "@/components/PricingInsightPanel";
import RefreshInsightButton from "@/components/RefreshInsightButton";
import { healthScore } from "@/lib/health";
import { getItem } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();
  const health = healthScore(item);
  const postedMarketplaces = item.listings
    .filter((l) => l.status === "active" || l.status === "assisted_posted")
    .map((l) => l.marketplace);

  return (
    <div className="space-y-4">
      <Link href="/listings" className="text-sm text-zinc-500">
        ← Listings
      </Link>

      <div className="flex gap-2 overflow-x-auto">
        {item.photos.map((p) => (
          <div
            key={p.id}
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/10 text-[11px] text-zinc-500"
          >
            Photo
          </div>
        ))}
      </div>

      {item.agent && (
        <Link
          href={`/items/${item.id}/review`}
          className="card block border-blue-400/20 bg-blue-500/10 p-3.5 text-sm text-blue-200"
        >
          The agent drafted marketplace copy, prices, and a negotiation script.
          <span className="font-semibold"> View the full review →</span>
        </Link>
      )}

      <ListingHealthScore health={health} />

      <ItemForm item={item} />

      <div className="space-y-2">
        <PricingInsightPanel insight={item.insight} />
        <RefreshInsightButton itemId={item.id} />
      </div>

      <section className="card">
        <h2 className="section-label">Price history</h2>
        <div className="mt-3">
          <PriceHistoryChart history={item.priceHistory} />
        </div>
      </section>

      <section className="card">
        <h2 className="section-label">Log marketplace stats</h2>
        <div className="mt-3">
          <ManualStatsForm itemId={item.id} marketplaces={postedMarketplaces} />
        </div>
      </section>

      {item.listings.length > 0 && (
        <section className="card">
          <h2 className="section-label">Where it&apos;s listed</h2>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.listings.map((l) => (
              <MarketplaceStatusChip key={l.marketplace} listing={l} />
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="section-label">Activity</h2>
        <div className="mt-3">
          <ActivityTimeline item={item} />
        </div>
      </section>
    </div>
  );
}
