import { categoryFor } from "../categories";
import { itemFloor } from "../recommendations";
import { CONDITION_LABELS, type Item, type MarketplaceId } from "../types";

/** Four price tiers derived from agent data when present, insight otherwise. */
export function priceTiers(item: Item) {
  const s = item.agent?.pricing.strategy;
  const floor = itemFloor(item);
  return {
    maxProfit: s?.maxProfit ?? item.insight.high,
    realistic: s?.realistic ?? item.insight.estimate,
    fastSale: s?.fastSale ?? item.insight.low,
    floor,
  };
}

/** Existing per-marketplace agent copy when available, item fields otherwise. */
export function baseCopy(item: Item, marketplace: MarketplaceId) {
  const copy = item.agent?.copy[marketplace];
  return {
    title: copy?.title ?? item.title,
    description: copy?.body ?? item.description,
    keywords: copy?.keywords ?? categoryFor(item).keywordSuggestions,
  };
}

export function baseAnalysis(item: Item) {
  const category = categoryFor(item);
  const strengths: string[] = [];
  const gaps: string[] = [];
  if (/\d/.test(item.title)) strengths.push("Title carries a model number, searchable");
  else gaps.push("Title has no model number");
  if (item.photos.length >= 3) strengths.push(`${item.photos.length} photos attached`);
  else gaps.push(`Only ${item.photos.length} photo${item.photos.length === 1 ? "" : "s"}, category wants ${category.photoChecklist.length}`);
  if (item.description.length >= 80) strengths.push("Detailed description");
  else gaps.push("Description is thin");
  return { category, strengths, gaps };
}

export function commonFieldChecks(item: Item): {
  field: string;
  label: string;
  ok: boolean;
  hint?: string;
}[] {
  return [
    {
      field: "title",
      label: "Title",
      ok: item.title.trim().split(/\s+/).length >= 3,
      hint: "At least brand + item + spec",
    },
    {
      field: "price",
      label: "Price",
      ok: item.price > 0,
      hint: "Set a price above zero",
    },
    {
      field: "description",
      label: "Description",
      ok: item.description.length >= 40,
      hint: "A few honest sentences minimum",
    },
    {
      field: "photos",
      label: "Photos",
      ok: item.photos.length >= 1,
      hint: "At least one photo",
    },
    {
      field: "condition",
      label: "Condition",
      ok: !!item.condition,
      hint: `Set condition (currently ${CONDITION_LABELS[item.condition]})`,
    },
  ];
}
