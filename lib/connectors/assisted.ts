import type { Item, MarketplaceId } from "../types";
import { CONDITION_LABELS } from "../types";

/**
 * Assisted-post targets: marketplaces without a public listing API for
 * individual sellers. We prepare the listing content and deep-link to the
 * platform's own create page — the user pastes and taps Post themselves.
 * No scraping, no automation against these sites.
 */
export const ASSISTED_IDS = ["facebook", "craigslist", "mercari", "poshmark"] as const;
export type AssistedId = (typeof ASSISTED_IDS)[number];

export function isAssisted(id: MarketplaceId): id is AssistedId {
  return (ASSISTED_IDS as readonly string[]).includes(id);
}

export const ASSISTED_TARGETS: Record<
  AssistedId,
  { label: string; createUrl: string; tip: string }
> = {
  facebook: {
    label: "Facebook Marketplace",
    createUrl: "https://www.facebook.com/marketplace/create/item",
    tip: "Facebook requires you to tap Post yourself — there is no public listing API for individual sellers.",
  },
  craigslist: {
    label: "Craigslist",
    createUrl: "https://post.craigslist.org/",
    tip: "Craigslist has no listing API. Pick your city and category, then paste the draft.",
  },
  mercari: {
    label: "Mercari",
    createUrl: "https://www.mercari.com/sell/",
    tip: "Mercari has no public listing API. Paste the draft into the sell form.",
  },
  poshmark: {
    label: "Poshmark",
    createUrl: "https://poshmark.com/create-listing",
    tip: "Poshmark has no public listing API. Paste the draft into the create form.",
  },
};

export type AssistedDraft = {
  marketplace: AssistedId;
  label: string;
  createUrl: string;
  tip: string;
  clipboardText: string;
};

export function buildAssistedDraft(item: Item, marketplace: AssistedId): AssistedDraft {
  const target = ASSISTED_TARGETS[marketplace];
  const clipboardText = [
    item.title,
    "",
    `Price: $${item.price}`,
    `Condition: ${CONDITION_LABELS[item.condition]}`,
    item.category ? `Category: ${item.category}` : "",
    "",
    item.description,
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");
  return { marketplace, ...target, clipboardText };
}
