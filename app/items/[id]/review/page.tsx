import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ListingHealthScore from "@/components/ListingHealthScore";
import PriceStrategyCard from "@/components/PriceStrategyCard";
import { DEFAULT_RULES } from "@/lib/automation";
import { healthScore } from "@/lib/health";
import { pendingSorted } from "@/lib/recommendations";
import { getItem } from "@/lib/store";
import { CONDITION_LABELS, type MarketplaceId } from "@/lib/types";

export const dynamic = "force-dynamic";

const COPY_ORDER: { id: MarketplaceId; label: string }[] = [
  { id: "facebook", label: "Facebook Marketplace" },
  { id: "ebay", label: "eBay" },
  { id: "craigslist", label: "Craigslist" },
];

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();
  const agent = item.agent;
  if (!agent) redirect(`/items/${id}`);

  const health = healthScore(item);
  const nextAction = pendingSorted(item.recommendations)[0];
  const best = COPY_ORDER.map((c) => agent.copy[c.id])
    .filter(Boolean)
    .sort((a, b) => (b?.recommendedPrice ?? 0) - (a?.recommendedPrice ?? 0))[0];
  const bestLabel = COPY_ORDER.find((c) => c.id === best?.marketplace)?.label;
  const priceRule = DEFAULT_RULES.find((r) => r.type === "price_drop");

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-zinc-500">
        ← Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review your listing</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The agent drafted everything below. Nothing posts until you approve it.
        </p>
      </div>

      {best && (
        <section className="card border-blue-400/20 bg-gradient-to-br from-blue-500/15 to-violet-500/10">
          <h2 className="section-label">Best platform to start</h2>
          <p className="mt-1 text-base font-semibold">
            {bestLabel} at ${best.recommendedPrice}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Highest expected net for this item. Cross-post everywhere else after the first
            48 hours.
          </p>
        </section>
      )}

      <section className="card">
        <h2 className="section-label">Item</h2>
        <p className="mt-1 text-base font-medium">{agent.item.title}</p>
        <p className="text-sm text-zinc-500">
          {agent.item.category} · {CONDITION_LABELS[agent.item.condition]}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {agent.item.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.item.tags.map((t) => (
            <span key={t} className="chip bg-white/5 text-zinc-400">
              {t}
            </span>
          ))}
        </div>
      </section>

      <PriceStrategyCard pricing={agent.pricing} />

      <ListingHealthScore health={health} />

      {nextAction && (
        <section className="card border-amber-400/20 bg-amber-500/10">
          <h2 className="section-label">Next recommended action</h2>
          <p className="mt-1 text-sm font-medium text-amber-200">{nextAction.message}</p>
        </section>
      )}

      {priceRule && (
        <section className="card">
          <h2 className="section-label">Automation on this item</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            {priceRule.description} You approve every suggestion before anything changes.
          </p>
        </section>
      )}

      {COPY_ORDER.map(({ id: mp, label }) => {
        const copy = agent.copy[mp];
        if (!copy) return null;
        return (
          <section key={mp} className="card">
            <div className="flex items-center justify-between">
              <h2 className="section-label">{label}</h2>
              <span className="text-sm font-semibold">${copy.recommendedPrice}</span>
            </div>
            <p className="mt-1 text-sm font-medium">{copy.title}</p>
            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">
              {copy.body}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {copy.keywords.map((k) => (
                <span key={k} className="chip bg-white/5 text-zinc-400">
                  {k}
                </span>
              ))}
            </div>
          </section>
        );
      })}

      <section className="card">
        <h2 className="section-label">Negotiation script</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-zinc-300">
          {agent.negotiationScript.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2 className="section-label">Photo checklist</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-400">
          {agent.photoChecklist.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      {agent.followUpQuestions.length > 0 && (
        <section className="card border-amber-400/20 bg-amber-500/10">
          <h2 className="text-sm font-medium text-amber-200">
            Answering these would sharpen the estimate
          </h2>
          <ul className="mt-1.5 list-disc pl-4 text-sm text-amber-200/80">
            {agent.followUpQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-2">
        <Link href={`/items/${item.id}`} className="btn-secondary flex-1">
          Edit details
        </Link>
        <Link href={`/items/${item.id}/post`} className="btn-primary flex-1">
          Looks good, post it
        </Link>
      </div>
    </div>
  );
}
