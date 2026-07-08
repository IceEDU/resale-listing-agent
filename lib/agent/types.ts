import type { Condition, MarketplaceId } from "../types";

/**
 * Agent Workflow v1 contract (docs/AGENT_WORKFLOW_V1.md).
 * The mock implementation lives in lib/agent/mock.ts; a real AI service
 * replaces it by implementing AgentService and swapping lib/agent/index.ts.
 */

export type SellerGoal = "fast_sale" | "max_profit" | "balanced";
export type AnswerCondition = "new" | "open_box" | "used";

/** Optional answers from the step-2 questions. All skippable. */
export type SellerAnswers = {
  condition?: AnswerCondition;
  missingParts?: string;
  paidPrice?: number;
  goal?: SellerGoal;
};

export type AgentInput = {
  hint?: string;
  photoCount: number;
  answers?: SellerAnswers;
};

/** The four price points every generated listing carries. */
export type PriceStrategy = {
  maxProfit: number;
  realistic: number;
  fastSale: number;
  floor: number;
};

export type MarketplaceCopy = {
  marketplace: MarketplaceId;
  title: string;
  body: string;
  keywords: string[];
  recommendedPrice: number;
};

export type AgentListing = {
  version: 1;
  generatedAt: string;
  item: {
    title: string;
    category: string;
    brand: string;
    condition: Condition;
    description: string;
    tags: string[];
  };
  pricing: {
    strategy: PriceStrategy;
    /** Price pre-selected from the strategy based on the seller's goal. */
    recommended: number;
    /** Never accept less than this — shown in the negotiation script. */
    minTake: number;
    goal: SellerGoal;
  };
  copy: Partial<Record<MarketplaceId, MarketplaceCopy>>;
  negotiationScript: string[];
  photoChecklist: string[];
  /** Questions a real agent would still ask — empty when answers suffice. */
  followUpQuestions: string[];
};

export interface AgentService {
  generateListing(input: AgentInput): Promise<AgentListing>;
}
