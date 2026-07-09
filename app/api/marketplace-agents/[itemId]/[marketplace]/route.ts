import { NextResponse } from "next/server";
import { categoryFor } from "@/lib/categories";
import { getMarketplaceAgent } from "@/lib/marketplace-agents";
import { getItem } from "@/lib/store";

type Params = { params: Promise<{ itemId: string; marketplace: string }> };

/**
 * Generates a marketplace-specific draft for the Posting Lab. Read-only:
 * the agent advises, the user posts.
 */
export async function GET(_req: Request, { params }: Params) {
  const { itemId, marketplace } = await params;
  const item = await getItem(itemId);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  const agent = getMarketplaceAgent(marketplace);
  if (!agent) return NextResponse.json({ error: "Unknown marketplace" }, { status: 400 });

  const category = categoryFor(item);
  const listing = item.listings.find((l) => l.marketplace === marketplace);

  return NextResponse.json({
    marketplace: agent.marketplace,
    label: agent.label,
    mode: agent.mode,
    safetyWarnings: agent.safetyWarnings,
    analysis: agent.analyzeItem(item),
    price: agent.suggestPrice(item),
    copy: agent.generateListingCopy(item),
    fields: agent.validateRequiredFields(item),
    nextAction: agent.recommendNextAction(item),
    strategy: agent.explainStrategy(item),
    extraGuidance: agent.extraGuidance?.(item) ?? [],
    category: {
      label: category.label,
      photoChecklist: category.photoChecklist,
      pricingNotes: category.pricingNotes,
      conditionRisks: category.conditionRisks,
    },
    listingStatus: listing?.status ?? null,
    listingUrl: listing?.externalUrl ?? null,
  });
}
