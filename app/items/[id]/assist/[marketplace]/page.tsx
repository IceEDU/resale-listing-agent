import Link from "next/link";
import { notFound } from "next/navigation";
import AssistActions from "@/components/AssistActions";
import { buildAssistedDraft, isAssisted } from "@/lib/connectors/assisted";
import {
  getMarketplaceAgentProfile,
  inferCategoryAgentProfile,
} from "@/lib/marketplace-agents";
import { getItem } from "@/lib/store";
import type { MarketplaceId } from "@/lib/types";

export const dynamic = "force-dynamic";

const FALLBACK_CHECKLIST = [
  "Cover shot: whole item, plain background, daylight",
  "Back / underside",
  "Brand label or model number close-up",
  "Any flaws or wear, honest close-up",
];

export default async function AssistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; marketplace: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id, marketplace } = await params;
  const { mode: rawMode } = await searchParams;
  const mode = rawMode === "refresh" ? "refresh" : "post";
  const item = await getItem(id);
  const marketplaceId = marketplace as MarketplaceId;
  if (!item || !isAssisted(marketplaceId)) notFound();

  const fallback = buildAssistedDraft(item, marketplaceId);
  const agentCopy = item.agent?.copy[marketplaceId];
  const title = agentCopy?.title ?? item.title;
  const price = agentCopy?.recommendedPrice ?? item.price;
  const body = agentCopy?.body ?? fallback.clipboardText;
  const photoChecklist = item.agent?.photoChecklist ?? FALLBACK_CHECKLIST;
  const marketplaceAgent = getMarketplaceAgentProfile(marketplaceId);
  const categoryAgent = inferCategoryAgentProfile({ category: item.category, title: item.title });
  const strategyTips = [
    ...marketplaceAgent.postingStrategy.slice(0, 2),
    ...(categoryAgent?.conditionChecks.slice(0, 2) ?? []),
  ];

  return (
    <div className="space-y-4">
      <Link href={`/items/${item.id}/post`} className="text-sm text-zinc-500">
        ← Marketplaces
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "refresh" ? "Repost to" : "Post to"} {fallback.label}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          {mode === "refresh"
            ? "Delete or edit the old listing, paste the updated fields, and repost it yourself. The app never touches the marketplace."
            : fallback.tip}
        </p>
      </div>

      <section className="card space-y-3 border-blue-400/20 bg-blue-500/10">
        <div>
          <h2 className="section-label">Marketplace agent guidance</h2>
          <p className="mt-1 text-sm font-medium text-blue-100">{marketplaceAgent.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-blue-100/75">
            Assisted-only: use these prompts to make the manual post stronger. No scraping, cookies,
            or auto-posting.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/60">
              Focus
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-blue-50/90">
              {marketplaceAgent.researchFocus.slice(0, 3).map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/60">
              Posting checks
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-blue-50/90">
              {strategyTips.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
        {categoryAgent && (
          <p className="rounded-xl bg-black/20 px-3 py-2 text-xs leading-relaxed text-blue-50/80">
            Category specialist: <span className="font-semibold">{categoryAgent.label}</span>. Watch for {" "}
            {categoryAgent.riskFlags.slice(0, 2).join(" and ")}.
          </p>
        )}
      </section>

      <AssistActions
        itemId={item.id}
        marketplace={fallback.marketplace}
        title={title}
        price={price}
        body={body}
        photoChecklist={photoChecklist}
        fieldGuide={fallback.fields}
        metricPrompts={fallback.metricPrompts}
        createUrl={fallback.createUrl}
        mode={mode}
      />
    </div>
  );
}
