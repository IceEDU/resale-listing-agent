import { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/db";
import { runJob } from "../lib/jobs/runner";
import { prismaRepo } from "../lib/repo/prisma";

/**
 * Persistence smoke test (npm run smoke:persistence).
 *
 * Exercises the real Prisma repository end to end, then proves the data hit
 * Postgres by re-reading it with a completely fresh client connection, and
 * finally cleans up after itself — no test data is left behind.
 *
 *   1. create item (photos + insight) through the repository layer
 *   2. update price/description, attach a listing
 *   3. disconnect, re-read with a brand-new PrismaClient
 *   4. assert everything survived
 *   5. delete the item (cascades to photos/listings/insights), verify gone
 */
const TITLE = `Smoke test item ${Date.now()}`;

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    fail("DATABASE_URL is not set — this test needs Prisma mode. See README.");
  }

  console.log("1. Creating item through the repository layer…");
  const created = await prismaRepo.createItem({ hint: TITLE, photoCount: 2 });
  if (created.photos.length !== 2) fail("expected 2 photos on created item");

  console.log("2. Updating it and attaching a listing…");
  await prismaRepo.updateItem(created.id, { price: 123, description: "smoke edit" });
  await prismaRepo.upsertListing(created.id, {
    marketplace: "facebook",
    mode: "assisted",
    status: "draft",
  });

  console.log("3. Re-reading with a fresh Prisma client connection…");
  await prisma().$disconnect();
  const fresh = new PrismaClient();
  try {
    const found = await fresh.item.findUnique({
      where: { id: created.id },
      include: { photos: true, listings: true, insights: true },
    });
    if (!found) fail("item not found after reconnect — data did not persist");
    if (Number(found.price) !== 123) fail(`price did not persist (got ${found.price})`);
    if (found.description !== "smoke edit") fail("description did not persist");
    if (found.photos.length !== 2) fail("photos did not persist");
    if (found.listings.length !== 1 || found.listings[0].marketplace !== "FACEBOOK") {
      fail("listing did not persist");
    }
    if (found.insights.length < 1) fail("pricing insight did not persist");
    console.log("4. All assertions passed — item, photos, listing, insight persisted.");

    console.log("5. Cleaning up…");
    await fresh.item.delete({ where: { id: created.id } });
    const gone = await fresh.item.findUnique({ where: { id: created.id } });
    if (gone) fail("cleanup failed — test item still present");
    const orphans = await fresh.photo.count({ where: { itemId: created.id } });
    if (orphans > 0) fail("cleanup failed — orphan photos remain");
  } finally {
    await fresh.$disconnect();
  }

  console.log("6. Running self-audit over the final state…");
  const audit = await runJob("self-audit");
  if (audit.status !== "success") fail(`self-audit failed: ${audit.error}`);
  console.log(`   ${audit.summary}`);

  console.log("✓ Persistence smoke test passed. No test data left behind.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
