import Link from "next/link";
import MarketplacePostingLab from "@/components/MarketplacePostingLab";
import { buildAllMarketplaceCopyBundle, buildMarketplacePostingPlans } from "@/lib/marketplace-posting";
import { listItems } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PostingLabPage() {
  const items = await listItems();
  const plansByItem = Object.fromEntries(items.map((item) => [item.id, buildMarketplacePostingPlans(item)]));
  const allBundlesByItem = Object.fromEntries(items.map((item) => [item.id, buildAllMarketplaceCopyBundle(item)]));

  return (
    <div className="space-y-5">
      <Link href="/more" className="text-sm text-zinc-500">
        ← More
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace Posting Lab</h1>
        <p className="text-sm leading-relaxed text-zinc-500">
          A safe cross-listing test bench: generate per-marketplace copy bundles, check missing fields,
          open official sell pages, and route Facebook/Craigslist/Mercari/Poshmark through assisted-only
          flows. No scraping, cookies, login automation, or fake connector success.
        </p>
      </div>

      <MarketplacePostingLab items={items} plansByItem={plansByItem} allBundlesByItem={allBundlesByItem} />
    </div>
  );
}
