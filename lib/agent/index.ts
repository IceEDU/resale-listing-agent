import { mockAgent } from "./mock";
import type { AgentService } from "./types";

/**
 * Swap point for the real AI service. When one exists, return it here
 * (e.g. based on an env flag) — nothing else in the app changes.
 */
export function agent(): AgentService {
  return mockAgent;
}

export type {
  AgentInput,
  AgentListing,
  AgentService,
  MarketplaceCopy,
  PriceStrategy,
  SellerAnswers,
  SellerGoal,
} from "./types";
