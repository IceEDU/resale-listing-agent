import Link from "next/link";
import { notFound } from "next/navigation";
import AssistActions from "@/components/AssistActions";
import { buildAssistedDraft, isAssisted } from "@/lib/connectors/assisted";
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

      <AssistActions
        itemId={item.id}
        marketplace={fallback.marketplace}
        title={title}
        price={price}
        body={body}
        photoChecklist={photoChecklist}
        createUrl={fallback.createUrl}
        mode={mode}
      />
    </div>
  );
}
