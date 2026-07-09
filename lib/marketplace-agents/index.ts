import { amazonAgent } from "./amazon";
import { facebookAgent } from "./facebook";
import {
  craigslistAgent,
  ebayAgent,
  etsyAgent,
  mercariAgent,
  poshmarkAgent,
} from "./others";
import type { AgentMarketplace, MarketplaceAgent } from "./types";

export const MARKETPLACE_AGENTS: MarketplaceAgent[] = [
  facebookAgent,
  ebayAgent,
  craigslistAgent,
  mercariAgent,
  poshmarkAgent,
  etsyAgent,
  amazonAgent,
];

export function getMarketplaceAgent(
  marketplace: string,
): MarketplaceAgent | undefined {
  return MARKETPLACE_AGENTS.find((a) => a.marketplace === marketplace);
}

export type { AgentMarketplace, MarketplaceAgent };
export type {
  AgentAnalysis,
  AgentMode,
  FieldCheck,
  ListingCopyDraft,
  NextAction,
  PriceSuggestion,
} from "./types";
