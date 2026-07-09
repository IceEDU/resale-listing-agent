import { categoryFor } from "../categories";
import { API_CONNECTORS } from "../connectors";
import { ASSISTED_TARGETS } from "../connectors/assisted";
import type { Item, MarketplaceId } from "../types";
import { baseAnalysis, baseCopy, commonFieldChecks, priceTiers } from "./shared";
import type { MarketplaceAgent } from "./types";

function feeAdjusted(item: Item, feePct: number): number {
  const t = priceTiers(item);
  return Math.round(t.realistic * (1 + feePct));
}

function assistedAgent(
  marketplace: "craigslist" | "mercari" | "poshmark",
  opts: { feePct: number; angle: string; strategy: (item: Item) => string[] },
): MarketplaceAgent {
  const target = ASSISTED_TARGETS[marketplace];
  return {
    marketplace,
    label: target.label,
    mode: "assisted",
    safetyWarnings: [
      "No public listing API: posting stays manual, the app only prepares the draft",
    ],
    analyzeItem(item) {
      const { category, strengths, gaps } = baseAnalysis(item);
      return {
        summary: `${target.label}: ${opts.angle} ${category.label} fit: ${category.marketplaceFit[0] ?? "general"}.`,
        strengths,
        gaps,
      };
    },
    suggestPrice(item) {
      const t = priceTiers(item);
      const list = feeAdjusted(item, opts.feePct);
      return {
        list,
        floor: t.floor,
        reasoning:
          opts.feePct > 0
            ? `List at $${list} to cover roughly ${Math.round(opts.feePct * 100)}% in fees and land near your $${t.realistic} target. Floor stays $${t.floor}.`
            : `List at $${list}: cash marketplace, no fees. Floor stays $${t.floor}.`,
      };
    },
    generateListingCopy(item) {
      return baseCopy(item, marketplace);
    },
    validateRequiredFields(item) {
      return commonFieldChecks(item);
    },
    recommendNextAction(item) {
      return {
        label: `Copy the draft and post it on ${target.label} yourself`,
        href: `/items/${item.id}/assist/${marketplace}`,
        externalUrl: target.createUrl,
      };
    },
    explainStrategy: opts.strategy,
  };
}

export const craigslistAgent = assistedAgent("craigslist", {
  feePct: 0,
  angle: "no-fee local cash with an older, email-first buyer crowd.",
  strategy: (item) => {
    const t = priceTiers(item);
    return [
      "Craigslist buyers skew practical and price-driven: plain title, exact price, no emojis.",
      `Cash only, $${t.realistic} ask. State "cash, local pickup" to filter scammers early.`,
      "Ignore any reply asking to ship or pay by check: classic scam pattern.",
    ];
  },
});

export const mercariAgent = assistedAgent("mercari", {
  feePct: 0.1,
  angle: "shipped nationwide, fee-adjusted pricing.",
  strategy: () => [
    "Mercari is shipped-first: weigh the item and check the label cost before committing to a price.",
    "Promote/offer-to-likers beats price drops: send offers to watchers after 48 quiet hours.",
    "Ship within 24 hours; slow shipping tanks your seller rating fast.",
  ],
});

export const poshmarkAgent = assistedAgent("poshmark", {
  feePct: 0.15,
  angle: "fashion-focused, social selling with 20% fees priced in.",
  strategy: () => [
    "Poshmark takes 20% over $15, so the list price carries the fee: buyers expect it.",
    "Share your listing daily; Poshmark's feed rewards active closets over fresh listings.",
    "Bundle discounts move multi-item wardrobes: mention them in the description.",
  ],
});

function apiStubAgent(
  marketplace: "ebay" | "etsy",
  opts: { feePct: number; createUrl: string; strategy: (item: Item) => string[] },
): MarketplaceAgent {
  const connector = API_CONNECTORS[marketplace];
  return {
    marketplace,
    label: connector.label,
    mode: "api_stub",
    safetyWarnings: [
      `Official ${connector.label} API exists but this connector is an honest stub until credentials are configured: nothing is ever marked live without them`,
    ],
    analyzeItem(item) {
      const { category, strengths, gaps } = baseAnalysis(item);
      return {
        summary: `${connector.label}: shipped marketplace with real API automation later. ${category.label} fit: ${category.marketplaceFit[0] ?? "general"}.`,
        strengths,
        gaps: connector.isConfigured()
          ? gaps
          : [...gaps, "Connector not configured: posting stays a draft"],
      };
    },
    suggestPrice(item) {
      const t = priceTiers(item);
      const list = feeAdjusted(item, opts.feePct);
      return {
        list,
        floor: t.floor,
        reasoning: `List at $${list} to net about $${t.realistic} after roughly ${Math.round(opts.feePct * 100)}% fees plus shipping handling. Floor $${t.floor}.`,
      };
    },
    generateListingCopy(item) {
      return baseCopy(item, marketplace);
    },
    validateRequiredFields(item) {
      const checks = commonFieldChecks(item);
      checks.push({
        field: "connector",
        label: "API connector configured",
        ok: connector.isConfigured(),
        hint: "Without credentials, posting saves an honest draft only",
      });
      return checks;
    },
    recommendNextAction(item) {
      return connector.isConfigured()
        ? { label: `Publish via the ${connector.label} API from the post screen`, href: `/items/${item.id}/post` }
        : {
            label: `Save a draft in the app; configure ${connector.label} credentials for real publishing later`,
            href: `/items/${item.id}/post`,
            externalUrl: opts.createUrl,
          };
    },
    explainStrategy: opts.strategy,
  };
}

export const ebayAgent = apiStubAgent("ebay", {
  feePct: 0.13,
  createUrl: "https://www.ebay.com/sl/sell",
  strategy: (item) => [
    "eBay is search-driven: the model number in the title does the selling.",
    "Sold-comps set the market; price at the median of the last 30 days of solds.",
    `Shipped condition disputes are the risk for ${categoryFor(item).label.toLowerCase()}: photograph flaws before packing.`,
    "Future: Sell Inventory API publishes for real once credentials exist (roadmap phase 8).",
  ],
});

export const etsyAgent = apiStubAgent("etsy", {
  feePct: 0.1,
  createUrl: "https://www.etsy.com/sell",
  strategy: () => [
    "Etsy fits vintage (20+ years), handmade, and craft supplies only: check the item qualifies before listing.",
    "Tags carry Etsy search: use all 13, phrase-style ('mid century lamp'), not single words.",
    "Future: Open API v3 draft listings once credentials exist.",
  ],
});

export type { MarketplaceId };
