import RecommendationCard from "@/components/RecommendationCard";
import RefreshRecommendationsButton from "@/components/RefreshRecommendationsButton";
import { pendingSorted } from "@/lib/recommendations";
import { listRecommendations } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const all = await listRecommendations();
  const pending = pendingSorted(all) as typeof all;
  const resolved = all.filter((r) => r.status !== "pending").slice(0, 6);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">For you</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Suggestions from your automation rules. Nothing happens until you accept, and
          assisted marketplaces are always updated by you.
        </p>
      </div>

      <RefreshRecommendationsButton />

      {pending.length === 0 ? (
        <div className="card text-center text-sm text-zinc-500">
          All caught up. Log fresh stats on a listing to get new advice.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-label">Recently handled</h2>
          {resolved.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </section>
      )}
    </div>
  );
}
