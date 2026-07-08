import type { Item, RecommendationFeedEntry } from "@/lib/types";

export default function StatsStrip({
  items,
  recommendations,
}: {
  items: Item[];
  recommendations: RecommendationFeedEntry[];
}) {
  const active = items.filter((i) => i.status === "active").length;
  const draft = items.filter((i) => i.status === "draft").length;
  const sold = items.filter((i) => i.status === "sold").length;
  const stale = items.filter((i) => i.status === "stale").length;
  const estValue = items
    .filter((i) => i.status !== "sold")
    .reduce((sum, i) => sum + i.price, 0);
  const pending = recommendations.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-2">
      <div className="card bg-gradient-to-br from-blue-500/15 via-zinc-900/70 to-violet-500/10 p-5">
        <p className="section-label">Estimated portfolio value</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          ${estValue.toLocaleString()}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="chip bg-emerald-400/10 text-emerald-300">{active} active</span>
          <span className="chip bg-zinc-400/10 text-zinc-300">{draft} drafts</span>
          <span className="chip bg-amber-400/10 text-amber-300">{stale} stale</span>
          <span className="chip bg-sky-400/10 text-sky-300">{sold} sold</span>
          {pending > 0 && (
            <span className="chip bg-violet-400/15 text-violet-300">
              {pending} suggestion{pending === 1 ? "" : "s"} waiting
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
