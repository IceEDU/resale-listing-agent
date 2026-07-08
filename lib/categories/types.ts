import type { Item } from "../types";

/**
 * Category specialist module: static selling strategy for one category of
 * resale inventory. Pure data + a matcher, so it works without API keys and
 * is shared by every marketplace agent.
 */
export type CategoryStrategy = {
  id: string;
  label: string;
  /** Keyword match against item category/title/brand, first hit wins. */
  matchTerms: string[];
  keyDetails: string[];
  photoChecklist: string[];
  keywordSuggestions: string[];
  conditionRisks: string[];
  pricingNotes: string[];
  marketplaceFit: string[];
  buyerTrustTips: string[];
};

export function matchesItem(strategy: CategoryStrategy, item: Item): boolean {
  const haystack = `${item.category} ${item.title} ${item.brand}`.toLowerCase();
  return strategy.matchTerms.some((t) => haystack.includes(t));
}
