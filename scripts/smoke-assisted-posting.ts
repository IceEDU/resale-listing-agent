import { buildAssistedDraft, ASSISTED_IDS, ASSISTED_TARGETS } from "../lib/connectors/assisted";
import { API_CONNECTORS, marketplaceOptions } from "../lib/connectors";
import { toDraftListing } from "../lib/connectors";
import { seedItems } from "../lib/repo/seed-data";
import type { MarketplaceId } from "../lib/types";
import {
  CATEGORY_AGENT_PROFILES,
  MARKETPLACE_AGENT_PROFILES,
  inferCategoryAgentProfile,
  type SellerChannelId,
} from "../lib/marketplace-agents";

/**
 * Assisted posting smoke test.
 *
 * This is deliberately local and deterministic: it proves the marketplaces
 * without seller APIs stay assisted-only, the prepared draft has the fields a
 * human needs to paste, and official-API connectors remain honest stubs when
 * credentials are absent. No marketplace network calls, scraping, cookies, or
 * login automation are used here.
 */
function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function ok(message: string) {
  console.log(`✓ ${message}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) fail(message);
}

const forbiddenUrlFragments = ["login", "auth", "session", "cookie", "api", "graphql"];

async function main() {
  delete process.env.EBAY_CLIENT_ID;
  delete process.env.EBAY_CLIENT_SECRET;
  delete process.env.ETSY_KEYSTRING;
  delete process.env.ETSY_SHARED_SECRET;

  const item = seedItems()[0];
  assert(item, "seed item missing");

  console.log("1. Assisted marketplace targets are human-posted only");
  for (const marketplace of ASSISTED_IDS) {
    const target = ASSISTED_TARGETS[marketplace];
    const url = new URL(target.createUrl);
    assert(url.protocol === "https:", `${marketplace} create URL is not HTTPS`);
    assert(
      !forbiddenUrlFragments.some((fragment) => target.createUrl.toLowerCase().includes(fragment)),
      `${marketplace} create URL looks like a login/API/scraping endpoint: ${target.createUrl}`,
    );
    assert(
      /no (public )?(listing )?api|tap Post yourself|paste/i.test(target.tip),
      `${marketplace} tip does not clearly describe the assisted-only flow`,
    );
  }
  ok(`${ASSISTED_IDS.length} assisted targets use HTTPS create pages with manual-post guidance`);

  console.log("2. Assisted drafts contain the paste-ready basics and form field maps");
  for (const marketplace of ASSISTED_IDS) {
    const draft = buildAssistedDraft(item, marketplace);
    assert(draft.marketplace === marketplace, `${marketplace} draft returned the wrong marketplace`);
    assert(draft.clipboardText.includes(item.title), `${marketplace} draft missing title`);
    assert(draft.clipboardText.includes(`Price: $${item.price}`), `${marketplace} draft missing price`);
    assert(draft.clipboardText.includes("Condition:"), `${marketplace} draft missing condition`);
    assert(draft.clipboardText.includes(item.description), `${marketplace} draft missing description`);
    assert(draft.fields.length === ASSISTED_TARGETS[marketplace].fieldOrder.length, `${marketplace} field map length mismatch`);
    assert(draft.fields.every((field) => field.label && field.value && field.note), `${marketplace} field map has empty guidance`);
    assert(
      draft.fields.some((field) => /Photos?/i.test(field.label) && /does not send|Upload manually/i.test(field.note)),
      `${marketplace} field map missing manual photo-upload guidance`,
    );
    if (marketplace === "facebook") {
      assert(draft.fields[0]?.label === "Photos", "facebook field map should start with photos");
      assert(
        draft.fields.some((field) => field.label === "Location" && /public meetup/i.test(field.note)),
        "facebook field map missing safe public-meetup location note",
      );
    }
  }
  ok("each assisted draft includes paste-ready copy plus marketplace-specific manual field order");

  console.log("3. Marketplace picker copy does not claim direct assisted automation");
  const options = marketplaceOptions();
  for (const marketplace of ASSISTED_IDS) {
    const option = options.find((o) => o.id === marketplace);
    assert(option, `${marketplace} missing from marketplace options`);
    assert(option.mode === "assisted", `${marketplace} option is not assisted mode`);
    assert(
      !/pre-?filled|automatically|auto-post|posts automatically/i.test(option.blurb),
      `${marketplace} option overclaims assisted posting: ${option.blurb}`,
    );
  }
  ok("assisted marketplace options are labeled without auto-posting claims");

  console.log("4. Marketplace/category mini-agent profiles keep unsafe channels assisted or stubbed");
  const expectedChannels: SellerChannelId[] = [
    "facebook",
    "ebay",
    "etsy",
    "craigslist",
    "mercari",
    "poshmark",
    "amazon",
  ];
  for (const id of expectedChannels) {
    const profile = MARKETPLACE_AGENT_PROFILES[id];
    assert(profile, `${id} marketplace agent profile missing`);
    assert(profile.researchFocus.length > 0, `${id} profile missing research focus`);
    assert(profile.pricingInputs.length > 0, `${id} profile missing pricing inputs`);
    assert(profile.postingStrategy.length > 0, `${id} profile missing posting strategy`);
    if (["facebook", "craigslist", "mercari", "poshmark"].includes(id)) {
      assert(profile.postingMode === "assisted-only", `${id} must remain assisted-only`);
      assert(
        profile.guardrails.some((guardrail) => /No scraping|direct posting/i.test(guardrail.text)),
        `${id} profile missing assisted-only safety guardrail`,
      );
    }
    if (id === "amazon") {
      assert(profile.postingMode === "future-official-api", "amazon must stay a future official API stub");
      assert(
        profile.guardrails.some((guardrail) => /No fake Amazon integration|SP-API/i.test(guardrail.text)),
        "amazon profile missing SP-API/no-fake-integration guardrail",
      );
    }
  }
  assert(
    Object.keys(CATEGORY_AGENT_PROFILES).length >= 7,
    "category specialist profiles missing expected coverage",
  );
  const electronicsProfile = inferCategoryAgentProfile({
    category: "Electronics",
    title: "Nintendo Switch OLED console bundle",
  });
  assert(electronicsProfile?.id === "electronics", "category specialist inference missed electronics");
  const furnitureProfile = inferCategoryAgentProfile({
    category: "Furniture",
    title: "solid wood desk",
  });
  assert(
    furnitureProfile?.id === "home-goods-furniture",
    "category specialist inference missed furniture",
  );
  ok("mini-agent profiles cover Facebook-first assisted workflows, Amazon stubs, and category specialists");

  console.log("5. eBay/Etsy official API connectors stay honest without credentials");
  const connectorDraft = toDraftListing(item);
  for (const id of ["ebay", "etsy"] as const) {
    const connector = API_CONNECTORS[id];
    assert(!connector.isConfigured(), `${id} unexpectedly configured in smoke environment`);
    const result = await connector.createListing(connectorDraft);
    assert(result.ok === false, `${id} unconfigured connector reported ok=true`);
    assert(result.status === "draft", `${id} unconfigured connector returned ${result.status}, not draft`);
    assert(/not configured/i.test(result.note), `${id} unconfigured connector note is not explicit`);
  }
  ok("unconfigured API connectors return draft/not-configured, never fake live listings");

  console.log("\n✓ Assisted posting smoke test passed. No marketplace sites were contacted.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
