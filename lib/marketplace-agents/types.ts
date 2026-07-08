import type { Item, MarketplaceId } from "../types";

/**
 * Marketplace Agent System v1. One agent per marketplace, all pure functions
 * of the item so everything is testable without API keys. Agents advise and
 * draft; they never post. Modes:
 *   assisted  - user posts manually, app prepares everything (FB, CL, Mercari, Posh)
 *   api_stub  - official API exists, connector is an honest stub (eBay, Etsy)
 *   advisory  - guidance only, listing tracking not supported yet (Amazon)
 */
export type AgentMarketplace = MarketplaceId | "amazon";

export type AgentMode = "assisted" | "api_stub" | "advisory";

export type AgentAnalysis = {
  summary: string;
  strengths: string[];
  gaps: string[];
};

export type PriceSuggestion = {
  /** Ask/list price for this marketplace. */
  list: number;
  realisticTake?: number;
  fastSale?: number;
  floor?: number;
  reasoning: string;
};

export type ListingCopyDraft = {
  title: string;
  description: string;
  keywords: string[];
};

export type FieldCheck = {
  field: string;
  label: string;
  ok: boolean;
  hint?: string;
};

export type NextAction = {
  label: string;
  /** In-app route when the next step lives in this app. */
  href?: string;
  /** Official marketplace page to open, when posting is the next step. */
  externalUrl?: string;
};

export interface MarketplaceAgent {
  marketplace: AgentMarketplace;
  label: string;
  mode: AgentMode;
  /** Honest constraints and risks. Required for advisory agents. */
  safetyWarnings: string[];
  analyzeItem(item: Item): AgentAnalysis;
  suggestPrice(item: Item): PriceSuggestion;
  generateListingCopy(item: Item): ListingCopyDraft;
  validateRequiredFields(item: Item): FieldCheck[];
  recommendNextAction(item: Item): NextAction;
  explainStrategy(item: Item): string[];
  /** Optional extra guidance sections (Facebook uses this heavily). */
  extraGuidance?(item: Item): { label: string; lines: string[] }[];
}
