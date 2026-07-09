import { categoryFor } from "../categories";
import type { Item } from "../types";
import { baseAnalysis, baseCopy, commonFieldChecks, priceTiers } from "./shared";
import type { MarketplaceAgent } from "./types";

function facebookDescription(item: Item): string {
  const copy = baseCopy(item, "facebook");
  return [
    copy.description,
    "",
    "Cash or Zelle at pickup. Porch pickup or public meetup, flexible on time.",
  ].join("\n");
}

/**
 * Facebook Local Agent: the most complete agent because most inventory moves
 * here. Everything is assisted: the agent drafts, the user posts.
 */
export const facebookAgent: MarketplaceAgent = {
  marketplace: "facebook",
  label: "Facebook Marketplace",
  mode: "assisted",
  safetyWarnings: [
    "No public listing API for individual sellers: posting is always manual",
    "The app never scrapes Facebook or automates the browser",
  ],

  analyzeItem(item) {
    const { category, strengths, gaps } = baseAnalysis(item);
    return {
      summary: `Local cash sale, ${category.label.toLowerCase()} playbook. Facebook rewards fresh listings with fast, honest photos and same-day pickup availability.`,
      strengths,
      gaps,
    };
  },

  suggestPrice(item) {
    const t = priceTiers(item);
    return {
      list: t.realistic,
      realisticTake: Math.max(Math.round(t.realistic * 0.93), t.floor),
      fastSale: t.fastSale,
      floor: t.floor,
      reasoning: `List at $${t.realistic} (local cash, no fees). Most Facebook buyers open at 70-80% of ask, so expect to land near $${Math.max(Math.round(t.realistic * 0.93), t.floor)}. Take $${t.fastSale} for a same-week pickup. Never below $${t.floor}.`,
    };
  },

  generateListingCopy(item) {
    const copy = baseCopy(item, "facebook");
    const category = categoryFor(item);
    return {
      title: copy.title,
      description: facebookDescription(item),
      keywords: [...new Set([...copy.keywords, ...category.keywordSuggestions])].slice(0, 10),
    };
  },

  validateRequiredFields(item) {
    const generatedDescription = facebookDescription(item);
    return [
      ...commonFieldChecks(item),
      {
        field: "pickup",
        label: "Pickup plan",
        ok: /pickup|meetup|porch/i.test(generatedDescription),
        hint: "Say how handover works: porch pickup or public meetup",
      },
    ];
  },

  recommendNextAction(item) {
    const fb = item.listings.find((l) => l.marketplace === "facebook");
    if (!fb || fb.status === "draft" || fb.status === "ready") {
      return {
        label: "Copy the draft and post it on Facebook yourself",
        href: `/items/${item.id}/assist/facebook`,
        externalUrl: "https://www.facebook.com/marketplace/create/item",
      };
    }
    if (fb.status === "assisted_posted") {
      return {
        label: "Log views and messages so the agent can advise next moves",
        href: `/items/${item.id}`,
      };
    }
    return { label: "Listing is settled, nothing to do on Facebook", href: `/items/${item.id}` };
  },

  explainStrategy(item) {
    const t = priceTiers(item);
    return [
      `Facebook is a velocity market: listings get most of their views in the first 48 hours, so post when you can answer messages quickly.`,
      `Local cash means zero fees: your $${t.realistic} ask nets $${t.realistic}, versus roughly $${Math.round(t.realistic * 0.87)} after fees elsewhere.`,
      "Renew or repost every 2 weeks; stale listings fall out of search.",
      "Photos in daylight against a plain background outperform flash shots consistently.",
    ];
  },

  extraGuidance(item) {
    const t = priceTiers(item);
    const category = categoryFor(item);
    return [
      {
        label: "Negotiation script",
        lines: item.agent?.negotiationScript ?? [
          `Open at $${t.realistic}; counter lowballs with "lowest I can do is $${Math.round(t.floor * 1.1)}".`,
          `Accept anything between $${Math.max(Math.round(t.realistic * 0.93), t.floor)} and ask.`,
          `Offer $${Math.max(t.realistic - 5, t.floor)} for pickup today to close fast.`,
          `Walk away below $${t.floor}.`,
        ],
      },
      {
        label: "Safe pickup wording",
        lines: [
          '"Pickup near [busy public spot], daytime preferred. Cash or Zelle on handover."',
          '"Porch pickup works: payment first via Zelle, then I set it out."',
          "Never share your full address in the listing; send it only after a firm commitment.",
        ],
      },
      {
        label: "Repost and refresh",
        lines: [
          "Renew the listing every 7 days from Your Listings.",
          "After 14 days with no messages: delete, improve the first photo and title, repost fresh.",
          "The app tracks age and reminds you; reposting is always your tap.",
        ],
      },
      {
        label: "Manual stats",
        lines: [
          "Facebook shows you clicks and saves on Your Listings: log them in the app weekly.",
          "Messages > 0 flips the app's advice from price-drop to hold automatically.",
        ],
      },
      {
        label: "Buyer trust",
        lines: category.buyerTrustTips,
      },
    ];
  },
};
