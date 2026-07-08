import { ASSISTED_TARGETS, type AssistedId } from "./connectors/assisted";
import type { Item, MarketplaceId } from "./types";
import { CONDITION_LABELS } from "./types";

export type PostingSafetyMode = "assisted" | "official_api_stub";

export type MarketplaceField = {
  key: string;
  label: string;
  value: string;
  required: boolean;
  hint: string;
};

export type MarketplacePostingPlan = {
  marketplace: MarketplaceId;
  label: string;
  safetyMode: PostingSafetyMode;
  status: "ready_to_copy" | "needs_official_api" | "missing_required_info";
  createUrl?: string;
  nextAction: string;
  safetyNote: string;
  missing: string[];
  checklist: string[];
  fields: MarketplaceField[];
  copyBundle: string;
};

const API_STUB_NOTES: Record<Extract<MarketplaceId, "ebay" | "etsy">, { label: string; url: string }> = {
  ebay: {
    label: "eBay",
    url: "https://www.ebay.com/sl/sell",
  },
  etsy: {
    label: "Etsy",
    url: "https://www.etsy.com/your/shops/me/tools/listings/create",
  },
};

const PLATFORM_HINTS: Record<MarketplaceId, string[]> = {
  ebay: [
    "Official API automation only after OAuth and Sell Inventory APIs are configured.",
    "Use item specifics, shipping, returns, and condition details before publishing.",
  ],
  etsy: [
    "Official Open API work only after Etsy app credentials and OAuth are configured.",
    "Best for handmade, vintage, craft, or supply categories; avoid forcing unrelated inventory here.",
  ],
  facebook: [
    "Assisted-only. Open Facebook yourself, paste fields, and tap Post manually.",
    "Use local pickup details and a public meetup/safety note where appropriate.",
  ],
  craigslist: [
    "Assisted-only. Pick city/category manually and keep contact preferences intentional.",
    "Short, direct descriptions and honest condition notes work best.",
  ],
  mercari: [
    "Assisted-only. Fill brand/category/shipping manually in Mercari’s form.",
    "Mercari buyers respond well to concise condition and shipping notes.",
  ],
  poshmark: [
    "Assisted-only. Fill closet/category/size fields manually in Poshmark’s form.",
    "Use style keywords, measurements, and condition notes for fashion items.",
  ],
};

const MARKETPLACE_LABELS: Record<MarketplaceId, string> = {
  ebay: "eBay",
  etsy: "Etsy",
  facebook: ASSISTED_TARGETS.facebook.label,
  craigslist: ASSISTED_TARGETS.craigslist.label,
  mercari: ASSISTED_TARGETS.mercari.label,
  poshmark: ASSISTED_TARGETS.poshmark.label,
};

function compact(lines: string[]) {
  return lines.filter((line) => line.trim().length > 0).join("\n");
}

function commonFields(item: Item, marketplace: MarketplaceId): MarketplaceField[] {
  const agentCopy = item.agent?.copy[marketplace];
  const title = agentCopy?.title ?? item.title;
  const price = agentCopy?.recommendedPrice ?? item.price;
  const description = agentCopy?.body ?? item.description;
  const tags = agentCopy?.keywords?.join(", ") ?? item.agent?.item.tags.join(", ") ?? "";

  return [
    {
      key: "title",
      label: "Title",
      value: title,
      required: true,
      hint: "Paste into the marketplace title field.",
    },
    {
      key: "price",
      label: "Price",
      value: String(price),
      required: true,
      hint: "Confirm fees and shipping before final post.",
    },
    {
      key: "condition",
      label: "Condition",
      value: CONDITION_LABELS[item.condition],
      required: true,
      hint: "Match the closest marketplace condition option.",
    },
    {
      key: "category",
      label: "Category",
      value: item.category,
      required: true,
      hint: "Pick the closest category in the marketplace UI.",
    },
    {
      key: "brand",
      label: "Brand",
      value: item.brand,
      required: false,
      hint: "Use if the marketplace asks for brand/item specifics.",
    },
    {
      key: "description",
      label: "Description",
      value: description,
      required: true,
      hint: "Paste as the body; review for platform tone and prohibited terms.",
    },
    {
      key: "tags",
      label: "Tags / keywords",
      value: tags,
      required: false,
      hint: "Use where tags, style keywords, or item specifics are supported.",
    },
  ];
}

function planStatus(fields: MarketplaceField[], safetyMode: PostingSafetyMode) {
  const missing = fields.filter((field) => field.required && !field.value.trim()).map((field) => field.label);
  if (missing.length > 0) return { status: "missing_required_info" as const, missing };
  if (safetyMode === "official_api_stub") return { status: "needs_official_api" as const, missing };
  return { status: "ready_to_copy" as const, missing };
}

export function buildMarketplacePostingPlans(item: Item): MarketplacePostingPlan[] {
  return (["facebook", "craigslist", "mercari", "poshmark", "ebay", "etsy"] as MarketplaceId[]).map(
    (marketplace) => {
      const fields = commonFields(item, marketplace);
      const isAssistedMarketplace = marketplace in ASSISTED_TARGETS;
      const safetyMode: PostingSafetyMode = isAssistedMarketplace ? "assisted" : "official_api_stub";
      const { status, missing } = planStatus(fields, safetyMode);
      const createUrl = isAssistedMarketplace
        ? ASSISTED_TARGETS[marketplace as AssistedId].createUrl
        : API_STUB_NOTES[marketplace as "ebay" | "etsy"].url;
      const label = MARKETPLACE_LABELS[marketplace];
      const safetyNote = isAssistedMarketplace
        ? `${label} is assisted-only: this app prepares copy and opens the official page, but you paste and publish yourself.`
        : `${label} live posting is an honest stub until official OAuth/API connector work is configured.`;
      const copyBundle = compact([
        `${label} listing draft`,
        "====================",
        ...fields.map((field) => `${field.label}: ${field.value || "[missing]"}`),
        "",
        "Checklist:",
        ...PLATFORM_HINTS[marketplace].map((tip) => `- ${tip}`),
      ]);

      return {
        marketplace,
        label,
        safetyMode,
        status,
        createUrl,
        nextAction:
          status === "missing_required_info"
            ? `Add missing required info: ${missing.join(", ")}.`
            : safetyMode === "assisted"
              ? `Copy fields, open ${label}, paste manually, then save the listing URL in the assist flow.`
              : `Use manual posting for tomorrow, or implement ${label} official connector credentials before API publishing.`,
        safetyNote,
        missing,
        checklist: PLATFORM_HINTS[marketplace],
        fields,
        copyBundle,
      };
    },
  );
}

export function buildAllMarketplaceCopyBundle(item: Item) {
  return buildMarketplacePostingPlans(item)
    .map((plan) => plan.copyBundle)
    .join("\n\n---\n\n");
}
