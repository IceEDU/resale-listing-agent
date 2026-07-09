import { categoryFor } from "../categories";
import type { Item } from "../types";
import { baseAnalysis, commonFieldChecks, priceTiers } from "./shared";
import type { MarketplaceAgent } from "./types";

/**
 * Amazon Agent: advisory only. The app does not track Amazon listings and
 * will never pretend to. Guidance exists so a seller can judge whether an
 * item is worth the Amazon route at all.
 */
export const amazonAgent: MarketplaceAgent = {
  marketplace: "amazon",
  label: "Amazon (advisory)",
  mode: "advisory",
  safetyWarnings: [
    "Many categories and brands are gated: check approval before sourcing more of this item",
    "You must match an existing ASIN exactly; wrong-ASIN listings get pulled and strike your account",
    "Condition accuracy matters more than anywhere else: Amazon buyers return aggressively and metrics hit fast",
    "FBA vs FBM is a real decision (fees vs control) and comes later, not in this app yet",
    "Future integration would use the official SP-API plus Keepa-style price history, nothing else",
    "This app does not create Amazon listings and will not fake one: this panel is guidance only",
  ],

  analyzeItem(item) {
    const { category, strengths, gaps } = baseAnalysis(item);
    return {
      summary: `Advisory look at the Amazon route for this ${category.label.toLowerCase()} item. Amazon works for exact-model, high-demand goods; it punishes vague or worn items.`,
      strengths,
      gaps: [...gaps, "No ASIN match recorded yet: required before Amazon is realistic"],
    };
  },

  suggestPrice(item) {
    const t = priceTiers(item);
    const referral = 0.15;
    const net = Math.round(t.realistic * (1 - referral) - 5);
    return {
      list: t.realistic,
      reasoning: `At a $${t.realistic} sale, expect roughly $${net} after ~15% referral fee and minimum fulfillment costs. Compare that with $${t.realistic} cash on Facebook before bothering with gating and ASIN matching.`,
    };
  },

  generateListingCopy(item) {
    return {
      title: item.title,
      description:
        "Amazon listings attach to an existing ASIN's detail page; you do not write a fresh description for used goods. Note your condition comments honestly: they are the only free text buyers see.",
      keywords: categoryFor(item).keywordSuggestions,
    };
  },

  validateRequiredFields(item) {
    return [
      ...commonFieldChecks(item),
      {
        field: "asin",
        label: "ASIN match",
        ok: false,
        hint: "Find the exact ASIN on Amazon before anything else",
      },
      {
        field: "gating",
        label: "Category/brand ungated",
        ok: false,
        hint: "Check Seller Central whether this brand/category needs approval",
      },
    ];
  },

  recommendNextAction() {
    return {
      label: "Research the ASIN and gating in Seller Central (tracking not supported in this app yet)",
      externalUrl: "https://sellercentral.amazon.com/",
    };
  },

  explainStrategy(item) {
    const t = priceTiers(item);
    return [
      "Amazon suits exact-model items with steady demand and clean condition; one-off used goods usually net more locally.",
      `Fee drag is real: about 15% referral plus fulfillment. Your $${t.realistic} item nets meaningfully less than a local cash sale.`,
      "If this item's brand/category is gated, the Amazon route ends here until approval.",
      "When official SP-API credentials exist someday, this panel becomes a real connector; until then it stays honest guidance.",
    ];
  },
};
