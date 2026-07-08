import { buildAssistedDraft, ASSISTED_IDS, ASSISTED_TARGETS } from "../lib/connectors/assisted";
import { API_CONNECTORS, marketplaceOptions } from "../lib/connectors";
import { toDraftListing } from "../lib/connectors";
import { seedItems } from "../lib/repo/seed-data";
import type { MarketplaceId } from "../lib/types";

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

  console.log("2. Assisted drafts contain the paste-ready basics");
  for (const marketplace of ASSISTED_IDS) {
    const draft = buildAssistedDraft(item, marketplace);
    assert(draft.marketplace === marketplace, `${marketplace} draft returned the wrong marketplace`);
    assert(draft.clipboardText.includes(item.title), `${marketplace} draft missing title`);
    assert(draft.clipboardText.includes(`Price: $${item.price}`), `${marketplace} draft missing price`);
    assert(draft.clipboardText.includes("Condition:"), `${marketplace} draft missing condition`);
    assert(draft.clipboardText.includes(item.description), `${marketplace} draft missing description`);
  }
  ok("each assisted draft includes title, price, condition, and description");

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

  console.log("4. eBay/Etsy official API connectors stay honest without credentials");
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
