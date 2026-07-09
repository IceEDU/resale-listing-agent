import { readFileSync } from "node:fs";
import { categoryFor, CATEGORY_STRATEGIES } from "../lib/categories";
import { getMarketplaceAgent, MARKETPLACE_AGENTS } from "../lib/marketplace-agents";
import { buildSeedItem } from "../lib/repo/seed-data";

/**
 * Marketplace agent smoke test (npm run smoke:marketplace-agents).
 * Pure-function checks, no DB or API keys needed. Guards the safety contract:
 * Facebook is complete, Amazon warns and never claims live listing support,
 * categories return real guidance, and no agent fakes live success.
 */
function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}
function ok(message: string) {
  console.log(`✓ ${message}`);
}

const dewalt = buildSeedItem("smk_dewalt", "DeWalt DWE575 circular saw", {
  status: "active",
  createdDaysAgo: 3,
  price: 125,
  photoCount: 4,
  listings: [],
});

console.log("1. Facebook agent generates full guidance");
{
  const fb = getMarketplaceAgent("facebook");
  if (!fb) fail("facebook agent missing");
  if (fb.mode !== "assisted") fail("facebook must be assisted-only");
  const copy = fb.generateListingCopy(dewalt);
  if (!copy.title.trim()) fail("facebook produced no title");
  if (copy.description.length < 20) fail("facebook produced no real description");
  const price = fb.suggestPrice(dewalt);
  if (!(price.list > 0 && price.fastSale! > 0 && price.floor! > 0)) {
    fail("facebook price tiers incomplete");
  }
  if (!(price.floor! <= price.fastSale! && price.fastSale! <= price.list)) {
    fail(`facebook price tiers out of order: floor ${price.floor} fast ${price.fastSale} list ${price.list}`);
  }
  const guidance = fb.extraGuidance?.(dewalt) ?? [];
  const hasNegotiation = guidance.some((g) => /negotiation/i.test(g.label) && g.lines.length > 0);
  const hasPickup = guidance.some((g) => /pickup/i.test(g.label));
  const hasRepost = guidance.some((g) => /repost|refresh/i.test(g.label));
  const hasStats = guidance.some((g) => /stats/i.test(g.label));
  if (!hasNegotiation) fail("facebook missing negotiation script");
  if (!hasPickup) fail("facebook missing safe pickup wording");
  if (!hasRepost) fail("facebook missing repost/refresh guidance");
  if (!hasStats) fail("facebook missing manual stats guidance");
  if (!fb.recommendNextAction(dewalt).label) fail("facebook missing next action");
  ok("facebook: title, description, 4 price tiers, negotiation, pickup, repost, stats, next action");
}

console.log("2. Amazon agent warns and never claims live listing support");
{
  const az = getMarketplaceAgent("amazon");
  if (!az) fail("amazon agent missing");
  if (az.mode !== "advisory") fail("amazon must be advisory only");
  const warnings = az.safetyWarnings.join(" ").toLowerCase();
  for (const term of ["gated", "asin", "condition", "fba", "sp-api"]) {
    if (!warnings.includes(term)) fail(`amazon warnings missing "${term}"`);
  }
  if (!/not.*(fake|create|track)/i.test(az.safetyWarnings.join(" "))) {
    fail("amazon must state it does not fake/create listings");
  }
  if (az.recommendNextAction(dewalt).href) {
    fail("amazon next action must not link into an in-app listing flow");
  }
  ok("amazon: gating, ASIN, condition, FBA/FBM, SP-API warnings; no fake listing, no tracking");
}

console.log("3. Category strategies return photo checklist and pricing notes");
{
  if (CATEGORY_STRATEGIES.length < 7) fail("expected at least 7 category modules");
  for (const strat of CATEGORY_STRATEGIES) {
    if (strat.photoChecklist.length === 0) fail(`${strat.id} has no photo checklist`);
    if (strat.pricingNotes.length === 0) fail(`${strat.id} has no pricing notes`);
    if (strat.keywordSuggestions.length === 0) fail(`${strat.id} has no keywords`);
    if (strat.buyerTrustTips.length === 0) fail(`${strat.id} has no trust tips`);
  }
  const toolCat = categoryFor(dewalt);
  if (toolCat.id !== "tools") fail(`DeWalt saw matched "${toolCat.id}", expected tools`);
  ok(`${CATEGORY_STRATEGIES.length} categories, each with checklist/pricing/keywords/trust; DeWalt -> tools`);
}

console.log("4. No agent fakes live success; required fields validated");
{
  for (const agent of MARKETPLACE_AGENTS) {
    const fields = agent.validateRequiredFields(dewalt);
    if (fields.length === 0) fail(`${agent.marketplace} returned no field checks`);
    if (agent.safetyWarnings.length === 0) fail(`${agent.marketplace} has no safety warnings`);
    // api_stub agents must flag connector-not-configured, never claim live
    if (agent.mode === "api_stub") {
      const connectorCheck = fields.find((f) => f.field === "connector");
      if (!connectorCheck || connectorCheck.ok) {
        fail(`${agent.marketplace} api_stub must report connector not configured`);
      }
    }
  }
  // spot-check an item missing fields surfaces them
  const thin = buildSeedItem("smk_thin", "thing", {
    status: "draft",
    createdDaysAgo: 0,
    price: 0,
    photoCount: 0,
    listings: [],
  });
  const fbThin = getMarketplaceAgent("facebook")!.validateRequiredFields(thin);
  if (!fbThin.some((f) => !f.ok)) fail("thin item should have failing field checks");
  ok(`all ${MARKETPLACE_AGENTS.length} agents validate fields, warn honestly; stubs flag not-configured`);
}

console.log("5. Marketplace lab keeps Facebook assisted posting practical");
{
  const lab = readFileSync("components/MarketplaceLab.tsx", "utf8");
  const facebookAgentSource = readFileSync("lib/marketplace-agents/facebook.ts", "utf8");
  for (const phrase of [
    "Copy packet",
    "Post one item to Facebook Marketplace safely",
    "Publish from Facebook yourself",
    "never logs in, scrapes, clicks, or posts for you",
    "Paste the listing URL here",
    "views, saves, and messages",
  ]) {
    if (!lab.includes(phrase)) fail(`marketplace lab missing assisted Facebook UI phrase: ${phrase}`);
  }
  if (!facebookAgentSource.includes("https://www.facebook.com/marketplace/create/item")) {
    fail("facebook agent should route users to the official Facebook create-item page");
  }
  ok("marketplace lab: one-click packet, official Facebook open, safe manual posting checklist, stats prompt");
}

console.log("\n✓ Marketplace agent smoke test passed.");
