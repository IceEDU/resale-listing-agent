import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import RecommendationCard from "@/components/RecommendationCard";
import StatsStrip from "@/components/StatsStrip";
import { pendingSorted } from "@/lib/recommendations";
import { listItems, listRecommendations } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [items, recommendations] = await Promise.all([
    listItems(),
    listRecommendations(),
  ]);
  const nextActions = pendingSorted(recommendations).slice(0, 3) as typeof recommendations;
  const attention = items.filter((i) => i.status !== "sold").slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">What should I do today?</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your resale command center, updated as things change.
        </p>
      </div>

      <StatsStrip items={items} recommendations={recommendations} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-label">Next actions</h2>
          <Link href="/recommendations" className="text-xs text-blue-300">
            See all →
          </Link>
        </div>
        {nextActions.length === 0 ? (
          <div className="card text-sm text-zinc-500">
            Nothing urgent. Snap a new item or check back after logging fresh stats.
          </div>
        ) : (
          nextActions.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-label">Your listings</h2>
          <Link href="/listings" className="text-xs text-blue-300">
            All listings →
          </Link>
        </div>
        {attention.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="card border-dashed text-center">
            <p className="text-sm text-zinc-500">Nothing here yet.</p>
            <Link href="/new" className="btn-primary mt-3">
              Snap your first item
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
