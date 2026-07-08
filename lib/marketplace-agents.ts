import type { MarketplaceId } from "./types";

export type SellerChannelId = MarketplaceId | "amazon";
export type CategoryAgentId =
  | "electronics"
  | "tools"
  | "bikes-outdoor"
  | "collectibles"
  | "clothing-shoes"
  | "home-goods-furniture"
  | "books-media";

export type AgentGuardrail = {
  severity: "blocker" | "warning" | "note";
  text: string;
};

export type MarketplaceAgentProfile = {
  id: SellerChannelId;
  label: string;
  postingMode: "official-api" | "assisted-only" | "future-official-api";
  researchFocus: string[];
  pricingInputs: string[];
  postingStrategy: string[];
  guardrails: AgentGuardrail[];
  futureIntegrations: string[];
};

export type CategoryAgentProfile = {
  id: CategoryAgentId;
  label: string;
  keywords: string[];
  conditionChecks: string[];
  riskFlags: string[];
  pricingNotes: string[];
};

const assistedOnlyGuardrails: AgentGuardrail[] = [
  {
    severity: "blocker",
    text: "No scraping, cookies, login automation, background polling, or direct posting.",
  },
  {
    severity: "note",
    text: "Prepare copy, checklist, pricing guidance, and a marketplace create-page link; the seller posts manually.",
  },
];

export const MARKETPLACE_AGENT_PROFILES: Record<SellerChannelId, MarketplaceAgentProfile> = {
  facebook: {
    id: "facebook",
    label: "Facebook Local Agent",
    postingMode: "assisted-only",
    researchFocus: [
      "Local cash price bands and fast-sale price",
      "Title keywords buyers search locally",
      "Negotiation range and safe pickup wording",
      "Manual stats: views, saves, messages, and repost cadence",
    ],
    pricingInputs: ["Seller-entered comps", "Manual stats", "Item condition", "Local demand notes"],
    postingStrategy: [
      "Lead with brand/model and high-intent local keywords",
      "Use a slightly negotiable list price above the realistic take price",
      "Recommend refresh/repost only after manual stats show staleness",
    ],
    guardrails: assistedOnlyGuardrails,
    futureIntegrations: ["User-triggered foreground browser-extension stat capture only"],
  },
  ebay: {
    id: "ebay",
    label: "eBay Agent",
    postingMode: "official-api",
    researchFocus: [
      "Sold vs active comp spread",
      "Shipping weight, dimensions, and fee-aware net",
      "Condition notes and return-risk language",
    ],
    pricingInputs: ["eBay sold comps", "Active listings", "Shipping estimate", "Fee estimate"],
    postingStrategy: [
      "Prefer sold comps for price confidence",
      "Call out defects clearly to reduce INAD risk",
      "Use official Sell APIs only after OAuth credentials exist",
    ],
    guardrails: [
      {
        severity: "blocker",
        text: "Do not claim a listing is live unless the official eBay API confirms it.",
      },
      {
        severity: "warning",
        text: "Current connector is an honest not-configured stub until credentials are supplied.",
      },
    ],
    futureIntegrations: ["eBay Browse/Sell APIs", "OAuth", "Inventory/Offer/Fulfillment APIs"],
  },
  etsy: {
    id: "etsy",
    label: "Etsy Agent",
    postingMode: "official-api",
    researchFocus: ["Handmade/vintage/supply eligibility", "SEO tags", "Materials and style keywords"],
    pricingInputs: ["Comparable Etsy listings", "Material cost", "Shipping profile"],
    postingStrategy: ["Validate category fit first", "Use concise titles plus tag coverage", "Keep API publishing credential-gated"],
    guardrails: [
      {
        severity: "blocker",
        text: "Do not publish through Etsy unless Open API credentials and seller approval are configured.",
      },
    ],
    futureIntegrations: ["Etsy Open API v3", "OAuth", "Inventory and shipping profiles"],
  },
  craigslist: {
    id: "craigslist",
    label: "Craigslist / Local Agent",
    postingMode: "assisted-only",
    researchFocus: ["Local category choice", "Pickup safety", "Short direct copy", "Spam-avoidant wording"],
    pricingInputs: ["Local asking prices", "Fast-sale target", "Pickup radius"],
    postingStrategy: ["Keep copy plain", "State cash/pickup terms", "Avoid over-formatting"],
    guardrails: assistedOnlyGuardrails,
    futureIntegrations: ["None planned without an official seller API"],
  },
  mercari: {
    id: "mercari",
    label: "Mercari Agent",
    postingMode: "assisted-only",
    researchFocus: ["Shipping fit", "Buyer-fee sensitivity", "Bundle-friendly copy"],
    pricingInputs: ["Seller comps", "Shipping tier", "Condition and completeness"],
    postingStrategy: ["Emphasize included parts", "Price with offer room", "Use short mobile-friendly descriptions"],
    guardrails: assistedOnlyGuardrails,
    futureIntegrations: ["None planned without an official seller API"],
  },
  poshmark: {
    id: "poshmark",
    label: "Poshmark Agent",
    postingMode: "assisted-only",
    researchFocus: ["Brand/style keywords", "Size and measurements", "Offer-liker strategy"],
    pricingInputs: ["Style comps", "Brand strength", "Condition and measurements"],
    postingStrategy: ["Put brand, size, and style in the title", "Include measurements", "Leave room for offers"],
    guardrails: assistedOnlyGuardrails,
    futureIntegrations: ["None planned without an official seller API"],
  },
  amazon: {
    id: "amazon",
    label: "Amazon Agent",
    postingMode: "future-official-api",
    researchFocus: [
      "ASIN matching and catalog eligibility",
      "Restricted brands/categories and hazmat risk",
      "FBA vs FBM notes and do-not-list warnings",
    ],
    pricingInputs: ["ASIN match", "Buy Box context", "Referral/FBA fees", "Keepa-style history when licensed"],
    postingStrategy: [
      "Never create a new catalog offer without verified seller eligibility",
      "Flag restricted or gated categories before drafting",
      "Prefer a research stub until SP-API credentials and approvals exist",
    ],
    guardrails: [
      {
        severity: "blocker",
        text: "No fake Amazon integration: SP-API credentials, seller authorization, and eligibility checks are required before any listing action.",
      },
      {
        severity: "warning",
        text: "Amazon is not currently an app posting target; this profile is planning/research foundation only.",
      },
    ],
    futureIntegrations: ["Amazon Selling Partner API", "Keepa-compatible licensed data", "FBA fee estimator"],
  },
};

export const CATEGORY_AGENT_PROFILES: Record<CategoryAgentId, CategoryAgentProfile> = {
  electronics: {
    id: "electronics",
    label: "Electronics Specialist",
    keywords: ["brand", "model", "storage", "generation", "carrier/unlocked", "included accessories"],
    conditionChecks: ["Power-on proof", "serial/model photo", "screen/battery health", "ports and buttons"],
    riskFlags: ["account locks", "missing charger", "swollen battery", "unverified IMEI"],
    pricingNotes: ["Model accuracy matters more than broad category comps", "Bundle accessories only if they increase trust"],
  },
  tools: {
    id: "tools",
    label: "Tools Specialist",
    keywords: ["brand", "voltage", "tool-only", "battery count", "charger", "brushless"],
    conditionChecks: ["Test under load", "battery health", "model plate", "wear on chuck/blade/bit"],
    riskFlags: ["missing batteries", "aftermarket batteries", "heavy jobsite wear"],
    pricingNotes: ["Separate tool-only from kit comps", "Local marketplaces often beat shipping for heavy tools"],
  },
  "bikes-outdoor": {
    id: "bikes-outdoor",
    label: "Bikes & Outdoor Specialist",
    keywords: ["size", "frame material", "wheel size", "brand", "season", "accessories"],
    conditionChecks: ["Tire/brake condition", "rust", "frame damage", "fit/size"],
    riskFlags: ["cracked frame", "missing serial", "unsafe brakes"],
    pricingNotes: ["Seasonality is strong", "Local pickup wording matters for bulky items"],
  },
  collectibles: {
    id: "collectibles",
    label: "Collectibles Specialist",
    keywords: ["set", "year", "variant", "sealed/open", "authenticity", "grade"],
    conditionChecks: ["Packaging corners", "serial/auth marks", "completeness", "close-up flaws"],
    riskFlags: ["counterfeit risk", "missing COA", "condition overclaim"],
    pricingNotes: ["Sold comps trump active wish-prices", "Condition wording should be conservative"],
  },
  "clothing-shoes": {
    id: "clothing-shoes",
    label: "Clothing & Shoes Specialist",
    keywords: ["brand", "size", "gender", "style", "color", "measurements"],
    conditionChecks: ["Stains", "soles/heels", "tags", "measurements", "fabric wear"],
    riskFlags: ["replica risk", "odor", "missing size tag"],
    pricingNotes: ["Measurements reduce returns/questions", "Style keywords drive search"],
  },
  "home-goods-furniture": {
    id: "home-goods-furniture",
    label: "Home Goods & Furniture Specialist",
    keywords: ["dimensions", "material", "brand", "room", "style", "pickup only"],
    conditionChecks: ["Dimensions", "scratches", "stains", "stability", "fabric/pet/smoke notes"],
    riskFlags: ["difficult pickup", "hidden damage", "missing hardware"],
    pricingNotes: ["Fast local sale usually needs aggressive pricing", "Good dimensions reduce wasted messages"],
  },
  "books-media": {
    id: "books-media",
    label: "Books & Media Specialist",
    keywords: ["ISBN", "edition", "format", "set completeness", "condition"],
    conditionChecks: ["ISBN/UPC", "disc playback", "pages", "case/cover wear"],
    riskFlags: ["wrong edition", "scratched discs", "missing inserts"],
    pricingNotes: ["Low-value items often work best as lots", "Amazon/eBay fit depends on fees and restrictions"],
  },
};

const CATEGORY_MATCHERS: Record<CategoryAgentId, RegExp[]> = {
  electronics: [/electronics?/i, /phone|iphone|ipad|tablet|laptop|computer|camera|console|xbox|playstation|switch|tv/i],
  tools: [/tools?/i, /drill|saw|driver|battery|charger|dewalt|milwaukee|makita|ryobi/i],
  "bikes-outdoor": [/bike|bicycle|cycling|outdoor|camp|tent|kayak|ski|snowboard|fishing/i],
  collectibles: [/collectible|toy|figure|card|vintage|antique|memorabilia|sealed/i],
  "clothing-shoes": [/clothing|apparel|shoe|sneaker|boot|shirt|jacket|pants|dress|size/i],
  "home-goods-furniture": [/furniture|home|decor|chair|table|desk|dresser|sofa|couch|lamp|rug/i],
  "books-media": [/book|media|dvd|blu-?ray|cd|vinyl|game|isbn|upc/i],
};

export function getMarketplaceAgentProfile(id: SellerChannelId): MarketplaceAgentProfile {
  return MARKETPLACE_AGENT_PROFILES[id];
}

export function getCategoryAgentProfile(id: CategoryAgentId): CategoryAgentProfile {
  return CATEGORY_AGENT_PROFILES[id];
}

export function inferCategoryAgentProfile(input: {
  category?: string;
  title?: string;
}): CategoryAgentProfile | undefined {
  const haystack = `${input.category ?? ""} ${input.title ?? ""}`.trim();
  if (!haystack) return undefined;

  const match = (Object.keys(CATEGORY_MATCHERS) as CategoryAgentId[]).find((id) =>
    CATEGORY_MATCHERS[id].some((pattern) => pattern.test(haystack)),
  );

  return match ? CATEGORY_AGENT_PROFILES[match] : undefined;
}
