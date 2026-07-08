import { prisma } from "../lib/db";
import { runJob } from "../lib/jobs/runner";
import { generateRecommendations, itemFloor } from "../lib/recommendations";
import { prismaRepo } from "../lib/repo/prisma";
import { seedItems } from "../lib/repo/seed-data";

/**
 * Automation smoke test (npm run smoke:automation). Needs Prisma mode and a
 * seeded database. Covers: job runner + fingerprint dedupe, price floor
 * guarantee, stale-listing repost recommendation, manual stats flipping a
 * drop into a hold, and the self-audit detecting the seeded intentional
 * findings. Cleans up its temp item; demo data is left as seeded.
 */
function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function ok(message: string) {
  console.log(`✓ ${message}`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    fail("DATABASE_URL is not set. Run against a seeded Postgres (see README).");
  }

  console.log("1. Job runner + duplicate prevention");
  const first = await runJob("refresh-recommendations");
  if (first.status !== "success") fail(`first refresh failed: ${first.error}`);
  const second = await runJob("refresh-recommendations");
  if (second.status !== "success") fail(`second refresh failed: ${second.error}`);
  if (second.createdRecommendations !== 0) {
    fail(`second run duplicated ${second.createdRecommendations} recommendations`);
  }
  ok(`refresh idempotent (run 1: ${first.summary}; run 2 created 0)`);

  console.log("2. Price floor is never violated");
  for (const item of await prismaRepo.listItems()) {
    const floor = itemFloor(item);
    for (const rec of item.recommendations) {
      const p = rec.suggestedAction?.newPrice;
      if (rec.status === "pending" && p !== undefined && p < floor) {
        fail(`"${item.title}" suggestion $${p} below floor $${floor}`);
      }
    }
  }
  const synthetic = seedItems()[0];
  synthetic.price = itemFloor(synthetic) + 1;
  for (const d of generateRecommendations(synthetic)) {
    const p = d.suggestedAction?.newPrice;
    if (p !== undefined && p < itemFloor(synthetic)) {
      fail(`engine suggested $${p} below floor for near-floor item`);
    }
  }
  ok("all price suggestions at or above floor (seeded + synthetic near-floor item)");

  console.log("3. Stale Facebook listing gets an assisted repost recommendation");
  const items = await prismaRepo.listItems();
  const makita = items.find((i) => i.title.includes("Makita"));
  if (!makita) fail("Makita seed item missing, reseed first (npm run db:seed)");
  const repost = makita.recommendations.find(
    (r) => r.status === "pending" && r.type === "repost_assisted",
  );
  if (!repost) fail("no pending repost_assisted recommendation on the stale Makita");
  if (repost.message !== "Repost Makita compressor, listed 4 weeks ago") {
    fail(`unexpected repost message: "${repost.message}"`);
  }
  ok(`stale listing flagged: "${repost.message}"`);

  console.log("4. Manual stats flip a price drop into a hold (temp item)");
  const temp = await prismaRepo.createItem({ hint: "DeWalt DWE575 circular saw", photoCount: 4 });
  try {
    await prismaRepo.upsertListing(temp.id, {
      marketplace: "facebook",
      mode: "assisted",
      status: "assisted_posted",
      postedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    });
    let state = await prismaRepo.addMetric(temp.id, {
      marketplace: "facebook",
      views: 40,
      saves: 1,
      messages: 0,
    });
    if (!state?.recommendations.some((r) => r.status === "pending" && r.type === "price_drop")) {
      fail("quiet listing did not get a price-drop suggestion");
    }
    state = await prismaRepo.addMetric(temp.id, {
      marketplace: "facebook",
      views: 55,
      saves: 3,
      messages: 5,
    });
    const pending = state?.recommendations.filter((r) => r.status === "pending") ?? [];
    if (!pending.some((r) => r.type === "hold")) fail("busy listing did not get a hold");
    if (pending.some((r) => r.type === "price_drop")) {
      fail("price drop survived despite recent messages");
    }
    ok("messages > 0 replaced the drop with a hold");
  } finally {
    await prisma().item.delete({ where: { id: temp.id } });
  }

  console.log("5. Self-audit detects the seeded intentional findings");
  const audit = await runJob("self-audit");
  if (audit.status !== "success") fail(`self-audit failed: ${audit.error}`);
  const findings = (await prismaRepo.listAuditResults(100)).filter((f) => !f.resolved);
  if (!findings.some((f) => f.severity === "warning" && f.area === "listing")) {
    fail("stale-listing warning (Makita, 28 days) not detected");
  }
  if (!findings.some((f) => f.severity === "error" && f.area === "connector")) {
    fail("connector honesty error (Trek eBay active without credentials) not detected");
  }
  if (findings.some((f) => f.area === "privacy")) {
    fail("unexpected privacy finding on clean seed data");
  }
  ok(`self-audit found the intentional seed issues (${audit.summary})`);

  console.log(
    "6. /api/health: start the dev server and check it returns ok + database ok (browser step)",
  );

  console.log("\n✓ Automation smoke test passed. Temp data cleaned up.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma().$disconnect());
