import Link from "next/link";
import MarketplaceLab from "@/components/MarketplaceLab";
import { listItems } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MarketplaceLabPage() {
  const items = await listItems();

  return (
    <div className="space-y-4">
      <Link href="/more" className="text-sm text-zinc-500">
        ← More
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Posting lab</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pick an item, pick a marketplace, get that marketplace&apos;s playbook: price,
          copy, checks, and strategy. You always do the posting.
        </p>
      </div>
      {items.length === 0 ? (
        <div className="card text-center text-sm text-zinc-500">
          No items yet. Add one first, then come back to test drafts.
        </div>
      ) : (
        <MarketplaceLab
          items={items.map((i) => ({ id: i.id, title: i.title, price: i.price }))}
        />
      )}
    </div>
  );
}
