import Link from "next/link";
import MarketplaceStatusChip from "@/components/MarketplaceStatusChip";
import { HealthRing } from "@/components/ListingHealthScore";
import { healthScore } from "@/lib/health";
import type { Item } from "@/lib/types";

const STATUS_STYLES: Record<Item["status"], string> = {
  draft: "bg-zinc-400/10 text-zinc-300",
  active: "bg-emerald-400/10 text-emerald-300",
  sold: "bg-sky-400/10 text-sky-300",
  stale: "bg-amber-400/10 text-amber-300",
};

const STATUS_LABELS: Record<Item["status"], string> = {
  draft: "Draft",
  active: "Active",
  sold: "Sold",
  stale: "Stale",
};

function quickAction(item: Item): { label: string; href: string } {
  if (item.status === "draft" && item.agent)
    return { label: "Review & post", href: `/items/${item.id}/review` };
  if (item.status === "draft") return { label: "Finish details", href: `/items/${item.id}` };
  if (item.status === "stale") return { label: "Fix price", href: `/items/${item.id}` };
  if (item.status === "sold") return { label: "Details", href: `/items/${item.id}` };
  return { label: "Manage", href: `/items/${item.id}` };
}

export default function ListingCard({ item }: { item: Item }) {
  const health = healthScore(item);
  const recommended = item.agent?.pricing.recommended ?? item.insight.estimate;
  const action = quickAction(item);

  return (
    <div className="card p-3.5">
      <Link href={`/items/${item.id}`} className="flex gap-3">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/10 text-[11px] text-zinc-500">
          <span className="text-lg font-semibold text-zinc-300">{item.photos.length}</span>
          photo{item.photos.length === 1 ? "" : "s"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[15px] font-medium">{item.title}</h3>
            <span className={`chip shrink-0 ${STATUS_STYLES[item.status]}`}>
              {STATUS_LABELS[item.status]}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-semibold">${item.price}</span>
            <span className="text-xs text-zinc-500">rec ${recommended}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {item.listings.map((l) => (
              <MarketplaceStatusChip key={l.marketplace} listing={l} />
            ))}
            {item.listings.length === 0 && (
              <span className="text-[11px] text-zinc-600">Not posted yet</span>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
        <div className="flex items-center gap-2">
          <HealthRing health={health} size={34} />
          <span className="text-xs text-zinc-500">{health.label}</span>
        </div>
        <Link
          href={action.href}
          className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-100 active:bg-white/15"
        >
          {action.label}
        </Link>
      </div>
    </div>
  );
}
