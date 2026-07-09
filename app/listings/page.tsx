import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { listItems } from "@/lib/store";
import type { ItemStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Drafts" },
  { key: "stale", label: "Stale" },
  { key: "sold", label: "Sold" },
];

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const items = await listItems();
  const visible =
    filter === "all" ? items : items.filter((i) => i.status === (filter as ItemStatus));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Listings</h1>

      <nav className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/listings" : `/listings?filter=${f.key}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${
              filter === f.key
                ? "bg-white font-medium text-zinc-950"
                : "border border-white/10 bg-white/5 text-zinc-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-3">
        {visible.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
        {visible.length === 0 &&
          (items.length === 0 ? (
            <div className="card border-dashed text-center">
              <p className="text-sm text-zinc-500">Nothing here yet.</p>
              <Link href="/new" className="btn-primary mt-3">
                Snap your first item
              </Link>
            </div>
          ) : (
            <div className="card border-dashed text-center">
              <p className="text-sm text-zinc-500">
                No {FILTERS.find((f) => f.key === filter)?.label.toLowerCase() ?? ""}{" "}
                listings.
              </p>
              <Link href="/listings" className="btn-secondary mt-3">
                Show all listings
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}
