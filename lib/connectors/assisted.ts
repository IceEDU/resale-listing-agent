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
  { label: string; createUrl: string; tip: string; fieldOrder: string[] }
> = {
  facebook: {
    label: "Facebook Marketplace",
    createUrl: "https://www.facebook.com/marketplace/create/item",
    tip: "Facebook requires you to tap Post yourself — there is no public listing API for individual sellers.",
    fieldOrder: ["Photos", "Title", "Price", "Category", "Condition", "Description", "Availability", "Location"],
  },
  craigslist: {
    label: "Craigslist",
    createUrl: "https://post.craigslist.org/",
    tip: "Craigslist has no listing API. Pick your city and category, then paste the draft.",
    fieldOrder: ["Posting title", "Price", "Specific location", "Postal code", "Description", "Photos"],
  },
  mercari: {
    label: "Mercari",
    createUrl: "https://www.mercari.com/sell/",
    tip: "Mercari has no public listing API. Paste the draft into the sell form.",
    fieldOrder: ["Photos", "Title", "Description", "Category", "Brand", "Condition", "Shipping", "Price"],
  },
  poshmark: {
    label: "Poshmark",
    createUrl: "https://poshmark.com/create-listing",
    tip: "Poshmark has no public listing API. Paste the draft into the create form.",
    fieldOrder: ["Photos", "Title", "Description", "Category", "Brand", "Size", "Condition", "Original price", "Listing price"],
  },
};

export type AssistedField = {
  label: string;
  value: string;
  note: string;
};

export type AssistedDraft = {
  marketplace: AssistedId;
  label: string;
  createUrl: string;
  tip: string;
  clipboardText: string;
  fields: AssistedField[];
};

function buildFieldValue(item: Item, marketplace: AssistedId, label: string): string {
  const condition = CONDITION_LABELS[item.condition];
  switch (label) {
    case "Photos":
      return `${item.photos.length || "Add"} clear photos`;
    case "Title":
    case "Posting title":
      return item.agent?.copy[marketplace]?.title ?? item.title;
    case "Price":
    case "Listing price":
      return `$${item.agent?.copy[marketplace]?.recommendedPrice ?? item.price}`;
    case "Original price":
      return "Leave blank unless you know the original retail price";
    case "Category":
      return item.category || "Choose the closest marketplace category";
    case "Condition":
      return condition;
    case "Description":
      return item.agent?.copy[marketplace]?.body ?? item.description;
    case "Brand":
      return item.brand || "Unbranded / unknown";
    case "Size":
      return "Enter size/measurements only if relevant";
    case "Availability":
      return "Single item available; remove after sold";
    case "Location":
    case "Specific location":
    case "Postal code":
      return "Enter your preferred public meetup area manually";
    case "Shipping":
      return marketplace === "mercari" ? "Choose buyer/seller shipping manually" : "Set manually";
    default:
      return "Review manually";
  }
}

function buildFieldNote(marketplace: AssistedId, label: string): string {
  if (["Location", "Specific location", "Postal code"].includes(label)) {
    return "Do not paste a home address; use a public meetup area or ZIP/city.";
  }
  if (label === "Photos") {
    return "Upload manually; the app does not send files to the marketplace.";
  }
  if (label === "Shipping") {
    return "Pick the marketplace option yourself; fees and labels can change.";
  }
  if (marketplace === "facebook" && label === "Availability") {
    return "Keep this honest; mark sold inside Facebook after the buyer pays.";
  }
  return "Copy or choose this field manually in the marketplace form.";
}

export function buildAssistedDraft(item: Item, marketplace: AssistedId): AssistedDraft {
  const target = ASSISTED_TARGETS[marketplace];
  const fields = target.fieldOrder.map((label) => ({
    label,
    value: buildFieldValue(item, marketplace, label),
    note: buildFieldNote(marketplace, label),
  }));
  const clipboardText = [
    fields.find((field) => field.label === "Title" || field.label === "Posting title")?.value ?? item.title,
    "",
    `Price: ${fields.find((field) => field.label === "Price" || field.label === "Listing price")?.value ?? `$${item.price}`}`,
    `Condition: ${fields.find((field) => field.label === "Condition")?.value ?? CONDITION_LABELS[item.condition]}`,
    item.category ? `Category: ${fields.find((field) => field.label === "Category")?.value ?? item.category}` : "",
    "",
    fields.find((field) => field.label === "Description")?.value ?? item.description,
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");
  return { marketplace, ...target, clipboardText, fields };
}
