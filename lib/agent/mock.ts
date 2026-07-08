import { generateInsight } from "../insights";
import type { Condition, MarketplaceId } from "../types";
import { CONDITION_LABELS } from "../types";
import { mockVision } from "../vision";
import type {
  AgentInput,
  AgentListing,
  AgentService,
  MarketplaceCopy,
  PriceStrategy,
  SellerAnswers,
  SellerGoal,
} from "./types";

/**
 * Mock agent. Deterministic, template-based, zero network calls — stands in
 * for the real vision + pricing + copywriting models. Replace by swapping
 * the export in lib/agent/index.ts; the AgentListing shape is the contract.
 */

function conditionFromAnswers(answers: SellerAnswers | undefined, fallback: Condition): Condition {
  if (!answers?.condition) return fallback;
  if (answers.condition === "new") return "new";
  if (answers.condition === "open_box") return "like_new";
  const hasMissingParts =
    !!answers.missingParts && !/^(no|none|nothing|n\/a)?$/i.test(answers.missingParts.trim());
  return hasMissingParts ? "fair" : "good";
}

function pickRecommended(strategy: PriceStrategy, goal: SellerGoal): number {
  if (goal === "fast_sale") return strategy.fastSale;
  if (goal === "max_profit") return strategy.maxProfit;
  return strategy.realistic;
}

function baseTags(title: string, category: string, brand: string): string[] {
  const words = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && w !== brand.toLowerCase());
  return [...new Set([brand.toLowerCase(), ...words, category.toLowerCase()])]
    .filter(Boolean)
    .slice(0, 8);
}

const MARKETPLACE_PRICE_FACTOR: Record<MarketplaceId, number> = {
  facebook: 1.0,
  craigslist: 1.0,
  ebay: 1.08,
  etsy: 1.08,
  mercari: 1.1,
  poshmark: 1.15,
};

function marketplaceKeywords(
  marketplace: MarketplaceId,
  tags: string[],
  condition: Condition,
): string[] {
  const conditionTerm = CONDITION_LABELS[condition].toLowerCase();
  switch (marketplace) {
    case "ebay":
      return [...tags, conditionTerm, "fast shipping", "tested working"].slice(0, 10);
    case "facebook":
      return [...tags, "local pickup", "porch pickup ok", conditionTerm].slice(0, 8);
    case "craigslist":
      return [...tags, "cash", "local", conditionTerm].slice(0, 8);
    case "etsy":
      return [...tags, "vintage", "gift idea", conditionTerm].slice(0, 13);
    case "mercari":
      return [...tags, conditionTerm, "ships fast"].slice(0, 8);
    case "poshmark":
      return [...tags, conditionTerm, "bundle to save"].slice(0, 8);
  }
}

function marketplaceBody(
  marketplace: MarketplaceId,
  item: { title: string; description: string; condition: Condition },
  price: number,
  minTakeHintOk: boolean,
): string {
  const conditionLine = `Condition: ${CONDITION_LABELS[item.condition]}`;
  switch (marketplace) {
    case "ebay":
      return [
        item.description,
        "",
        conditionLine,
        "Ships within 1 business day, carefully packed.",
        "Returns accepted within 30 days.",
      ].join("\n");
    case "facebook":
      return [
        item.description,
        "",
        conditionLine,
        "Pickup or local meetup — flexible on time.",
        minTakeHintOk ? "Price is close to firm, small offers considered." : "Priced to sell.",
      ].join("\n");
    case "craigslist":
      return [
        item.description,
        "",
        conditionLine,
        `Cash, local pickup. Asking $${price}.`,
        "Text or email through the listing — no shipping, no checks.",
      ].join("\n");
    default:
      return [item.description, "", conditionLine].join("\n");
  }
}

function marketplaceTitle(marketplace: MarketplaceId, title: string, tags: string[]): string {
  if (marketplace === "ebay") {
    const extra = tags.filter((t) => !title.toLowerCase().includes(t)).slice(0, 2);
    return [title, ...extra].join(" ").slice(0, 80);
  }
  return title;
}

export const mockAgent: AgentService = {
  async generateListing(input: AgentInput): Promise<AgentListing> {
    const vision = mockVision(input.hint ?? "", input.photoCount);
    const answers = input.answers;
    const condition = conditionFromAnswers(answers, vision.condition);
    const goal: SellerGoal = answers?.goal ?? "balanced";

    const seed = `${input.hint ?? "item"}-${condition}-${input.photoCount}`;
    const insight = generateInsight(seed, vision.basePrice);
    const strategy: PriceStrategy = {
      maxProfit: insight.high,
      realistic: insight.estimate,
      fastSale: insight.low,
      floor: Math.max(Math.round(insight.low * 0.75), 5),
    };
    const recommended = pickRecommended(strategy, goal);
    const minTake = strategy.floor;

    const missing =
      answers?.missingParts && !/^(no|none|nothing|n\/a)?$/i.test(answers.missingParts.trim())
        ? answers.missingParts.trim()
        : undefined;
    const description = [
      vision.description,
      missing ? `Note: missing ${missing} — priced accordingly.` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const item = {
      title: vision.title,
      category: vision.category,
      brand: vision.brand,
      condition,
      description,
      tags: baseTags(vision.title, vision.category, vision.brand),
    };

    const copyFor = (marketplace: MarketplaceId): MarketplaceCopy => {
      const price = Math.round(recommended * MARKETPLACE_PRICE_FACTOR[marketplace]);
      return {
        marketplace,
        title: marketplaceTitle(marketplace, item.title, item.tags),
        body: marketplaceBody(marketplace, item, price, goal !== "fast_sale"),
        keywords: marketplaceKeywords(marketplace, item.tags, condition),
        recommendedPrice: price,
      };
    };

    const followUpQuestions: string[] = [];
    if (!answers?.condition) followUpQuestions.push("Is it new, open-box, or used?");
    if (answers?.missingParts === undefined)
      followUpQuestions.push("Any missing parts or accessories?");
    if (answers?.paidPrice === undefined)
      followUpQuestions.push("Roughly what did you pay for it?");
    if (!answers?.goal) followUpQuestions.push("Prefer a fast sale or max profit?");

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      item,
      pricing: { strategy, recommended, minTake, goal },
      copy: {
        facebook: copyFor("facebook"),
        ebay: copyFor("ebay"),
        craigslist: copyFor("craigslist"),
        mercari: copyFor("mercari"),
        poshmark: copyFor("poshmark"),
        etsy: copyFor("etsy"),
      },
      negotiationScript: [
        `Open at $${recommended}. ${insight.compsCount} similar items sold for $${insight.low}–$${insight.high} recently.`,
        `If a buyer offers between $${minTake} and $${recommended}, counter once at halfway, then accept.`,
        `If a buyer offers below $${minTake}, reply: "Thanks, but the lowest I can go is $${Math.round(minTake * 1.1)}."`,
        goal === "fast_sale"
          ? `To close fast: offer free local delivery or $${Math.max(recommended - 5, minTake)} for pickup today.`
          : `Hold near $${recommended} for the first week; drop 10% only if there are no serious offers.`,
        `Never accept less than $${minTake}${answers?.paidPrice ? ` (you paid $${answers.paidPrice})` : ""}.`,
      ],
      photoChecklist: [
        "Cover shot: whole item, plain background, daylight",
        "Back / underside",
        "Brand label, model or serial number close-up",
        "Any flaws or wear, honest close-up",
        "In use or next to a common object for scale",
      ],
      followUpQuestions,
    };
  },
};
