-- Agent Workflow v1: new listing lifecycle + agent output storage.
-- Maps existing rows (PENDING -> READY, ENDED -> DELISTED) so no data is lost.

ALTER TABLE "Listing" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Listing" ALTER COLUMN "status" TYPE TEXT;

UPDATE "Listing" SET "status" = 'READY' WHERE "status" = 'PENDING';
UPDATE "Listing" SET "status" = 'DELISTED' WHERE "status" = 'ENDED';

DROP TYPE "ListingStatus";
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'READY', 'ASSISTED_POSTED', 'ACTIVE', 'SOLD', 'DELISTED');

ALTER TABLE "Listing"
  ALTER COLUMN "status" TYPE "ListingStatus" USING ("status"::"ListingStatus");
ALTER TABLE "Listing" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "Item" ADD COLUMN "agentData" JSONB;
ALTER TABLE "Item" ADD COLUMN "answers" JSONB;
