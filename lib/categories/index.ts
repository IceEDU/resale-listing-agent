import type { Item } from "../types";
import { matchesItem, type CategoryStrategy } from "./types";

const electronics: CategoryStrategy = {
  id: "electronics",
  label: "Electronics",
  matchTerms: ["electronics", "phone", "iphone", "laptop", "tablet", "console", "camera", "tv", "headphone"],
  keyDetails: [
    "Exact model number and storage/spec variant",
    "Carrier lock status and activation-lock/iCloud sign-out",
    "Battery health percentage where the device reports it",
    "What is included: cable, charger, box, original accessories",
  ],
  photoChecklist: [
    "Powered on, home screen visible",
    "Model/serial screen or label",
    "All sides showing edges and corners",
    "Accessories laid out together",
    "Close-up of any scratch or dent",
  ],
  keywordSuggestions: ["unlocked", "tested", "works perfectly", "model number", "storage size"],
  conditionRisks: [
    "Battery degradation complaints after sale",
    "Activation lock not removed blocks the buyer",
    "Hidden screen burn-in or dead pixels",
  ],
  pricingNotes: [
    "Prices drop fast on model refresh cycles, sell sooner not later",
    "Unlocked commands 10-20% over carrier-locked",
    "Include-the-charger listings sell measurably faster",
  ],
  marketplaceFit: [
    "eBay strongest for shipped electronics with model-number search",
    "Facebook good for local same-day cash on phones and consoles",
  ],
  buyerTrustTips: [
    "Offer to demo the device working at pickup",
    "State the IMEI/serial is clean and verifiable",
    "Factory reset before handover, say so in the listing",
  ],
};

const tools: CategoryStrategy = {
  id: "tools",
  label: "Tools",
  matchTerms: ["tool", "drill", "saw", "compressor", "dewalt", "makita", "milwaukee", "ryobi"],
  keyDetails: [
    "Model number (buyers search by it)",
    "Bare tool vs kit: batteries, charger, case included or not",
    "Corded or cordless, voltage platform",
    "Hours of use or jobsite history if known",
  ],
  photoChecklist: [
    "Whole tool, plain background",
    "Model number plate close-up",
    "Battery and charger if included",
    "Chuck/blade/wear surfaces close-up",
    "Running if possible (video for local buyers)",
  ],
  keywordSuggestions: ["works great", "tested", "bare tool", "with battery", "model number"],
  conditionRisks: [
    "Worn brushes or chucks fail soon after sale",
    "Battery health is the top complaint on cordless kits",
  ],
  pricingNotes: [
    "Batteries drive kit value: a good 5Ah battery adds $40+",
    "Pro brands (DeWalt, Makita, Milwaukee) hold 50-60% of retail used",
    "Sell as kit when battery is healthy, bare when not",
  ],
  marketplaceFit: [
    "Facebook is the tool marketplace: contractors buy local cash daily",
    "eBay for rarer trade tools worth shipping",
  ],
  buyerTrustTips: [
    "Offer to demo under load at pickup",
    "State honestly if it came from a jobsite",
  ],
};

const bikesOutdoor: CategoryStrategy = {
  id: "bikes_outdoor",
  label: "Bikes and outdoor",
  matchTerms: ["bike", "bicycle", "trek", "outdoor", "kayak", "tent", "camping", "ski", "snowboard"],
  keyDetails: [
    "Frame size and rider height range",
    "Component group and recent maintenance",
    "Year/model if known",
    "Storage conditions (indoor vs outdoor)",
  ],
  photoChecklist: [
    "Full side profile, drive side",
    "Drivetrain close-up (cassette, chainrings)",
    "Frame size label or seat tube marking",
    "Tires and brake pads condition",
    "Any rust, dents, or paint chips honestly",
  ],
  keywordSuggestions: ["size M/L", "recently tuned", "ready to ride", "garage kept"],
  conditionRisks: [
    "Drivetrain wear is invisible in photos, gets flagged at pickup",
    "Wrong frame size drives most returns/backouts",
  ],
  pricingNotes: [
    "Strong spring/summer seasonality, prices sag 20-30% in winter",
    "Recent tune-up receipt supports a higher ask",
  ],
  marketplaceFit: [
    "Facebook/Craigslist dominate: bikes are try-before-buy local purchases",
    "Shipping bikes is possible on eBay but packing is heavy work",
  ],
  buyerTrustTips: [
    "Offer a short test ride with ID or payment held",
    "Meet at a bike shop for neutral ground",
  ],
};

const collectibles: CategoryStrategy = {
  id: "collectibles",
  label: "Collectibles",
  matchTerms: ["collectible", "lego", "card", "coin", "vintage", "antique", "figurine", "comic"],
  keyDetails: [
    "Set/issue/edition number and completeness",
    "Sealed vs opened, graded vs raw",
    "Provenance if notable",
  ],
  photoChecklist: [
    "Front and back, straight on, no glare",
    "Edition/set number close-up",
    "Seals, stamps, or grading labels",
    "Flaws under good light, honest close-ups",
  ],
  keywordSuggestions: ["sealed", "complete", "rare", "retired", "first edition"],
  conditionRisks: [
    "Condition grading disputes are the top complaint category",
    "Sun fading visible only in person",
  ],
  pricingNotes: [
    "Check sold comps, not asking prices: spreads are huge",
    "Sealed/graded items deserve eBay's wider audience",
  ],
  marketplaceFit: [
    "eBay first: collectors search there, auctions find true price",
    "Facebook only for bulky low-value lots",
  ],
  buyerTrustTips: [
    "Photograph under natural light, no filters, say so",
    "Ship with tracking and insurance, state it upfront",
  ],
};

const clothingShoes: CategoryStrategy = {
  id: "clothing_shoes",
  label: "Clothing and shoes",
  matchTerms: ["clothing", "shoe", "sneaker", "jacket", "fleece", "patagonia", "nike", "dress", "jeans"],
  keyDetails: [
    "Size on tag plus measurements (pit to pit, inseam)",
    "Fabric content and care condition",
    "Smoke-free/pet-free home",
  ],
  photoChecklist: [
    "Front and back laid flat or on a hanger",
    "Brand and size tags",
    "Fabric close-up showing texture/pilling",
    "Soles and heels for shoes",
    "Any stain or wear honestly",
  ],
  keywordSuggestions: ["men's M", "women's 8", "NWT", "like new", "measurements in photos"],
  conditionRisks: [
    "Fit disputes: measurements prevent most of them",
    "Odors and pilling not visible in photos",
  ],
  pricingNotes: [
    "Brand is everything: Patagonia/Arc'teryx hold value, fast fashion does not",
    "Bundle low-value pieces, list premium pieces solo",
  ],
  marketplaceFit: [
    "Poshmark and Mercari built for clothing, shipped",
    "Facebook works for outerwear and shoes locally",
  ],
  buyerTrustTips: [
    "Include a measuring-tape photo",
    "Disclose every flaw before the buyer finds it",
  ],
};

const furnitureHome: CategoryStrategy = {
  id: "furniture_home",
  label: "Furniture and home goods",
  matchTerms: ["furniture", "couch", "sofa", "table", "chair", "dresser", "kitchen", "mixer", "appliance", "kitchenaid"],
  keyDetails: [
    "Dimensions (buyers must know it fits)",
    "Material and construction (solid wood vs veneer)",
    "Working condition for appliances, all functions",
  ],
  photoChecklist: [
    "Whole piece from two angles in good light",
    "Surface close-ups showing finish",
    "Label/model plate for appliances",
    "Running/working shot for appliances",
    "Damage close-ups honestly",
  ],
  keywordSuggestions: ["solid wood", "works perfectly", "dimensions listed", "pickup only"],
  conditionRisks: [
    "Hidden water rings, wobble, or motor noise surface at pickup",
    "Size surprises kill deals at the door",
  ],
  pricingNotes: [
    "Furniture is buyer's-market local: price to move, expect negotiation",
    "Small working appliances (stand mixers) hold value unusually well",
  ],
  marketplaceFit: [
    "Facebook only realistic channel for big furniture (local pickup)",
    "Small appliances also do well shipped on eBay/Mercari",
  ],
  buyerTrustTips: [
    "Post exact dimensions and a doorway-width reminder",
    "Offer to run the appliance on video call or at pickup",
  ],
};

const booksMedia: CategoryStrategy = {
  id: "books_media",
  label: "Books and media",
  matchTerms: ["book", "vinyl", "record", "dvd", "blu-ray", "cd", "game", "media"],
  keyDetails: [
    "Edition, printing, and ISBN/catalog number",
    "Completeness: dust jacket, inserts, manuals, discs",
  ],
  photoChecklist: [
    "Cover straight on",
    "Spine and page edges",
    "Copyright/edition page or catalog number",
    "Disc surfaces for media",
  ],
  keywordSuggestions: ["first edition", "complete", "ISBN", "tested plays great"],
  conditionRisks: [
    "Ex-library markings and water damage disputes",
    "Disc rot/scratches on older media",
  ],
  pricingNotes: [
    "Most books are $5-15; check comps before listing singles",
    "First editions, textbooks, and sealed media are the exceptions worth solo listings",
  ],
  marketplaceFit: [
    "eBay for anything collectible or shippable in a flat-rate box",
    "Facebook for lots and bulk boxes locally",
  ],
  buyerTrustTips: [
    "Photograph the actual copy, never a stock image",
    "Grade conservatively, note it in the listing",
  ],
};

const general: CategoryStrategy = {
  id: "general",
  label: "General",
  matchTerms: [],
  keyDetails: [
    "Brand, model, and what is included",
    "Why you are selling (buyers ask)",
  ],
  photoChecklist: [
    "Whole item in daylight, plain background",
    "Brand/model label close-up",
    "Any flaws honestly",
    "Scale reference next to a common object",
  ],
  keywordSuggestions: ["works great", "smoke-free home", "pickup today"],
  conditionRisks: ["Undisclosed flaws cause returns and bad reviews"],
  pricingNotes: ["Check sold comps; price at the median, negotiate from there"],
  marketplaceFit: ["Facebook first for local cash, eBay when it ships cheaply"],
  buyerTrustTips: ["Respond fast, propose a public meetup spot"],
};

export const CATEGORY_STRATEGIES: CategoryStrategy[] = [
  electronics,
  tools,
  bikesOutdoor,
  collectibles,
  clothingShoes,
  furnitureHome,
  booksMedia,
];

export function categoryFor(item: Item): CategoryStrategy {
  return CATEGORY_STRATEGIES.find((s) => matchesItem(s, item)) ?? general;
}

export { general as GENERAL_STRATEGY };
export type { CategoryStrategy };
