# Flagship foundation review

Review date: 2026-07-08
Branch: `nightsky/marketplace-posting-lab`

## What changed

- Added a safe Marketplace Posting Lab at `/more/posting-lab`.
- Added `lib/marketplace-posting.ts` to build per-marketplace posting plans, required-field checks, and copy bundles from the canonical item draft.
- Added `components/MarketplacePostingLab.tsx` for item selection, field copying, full bundle copying, and marketplace cards.
- Linked the lab from `/more`.
- Improved assisted posting so the user can paste the public marketplace listing URL before marking a manually posted/refreshed listing done.
- Fixed the dynamic assisted route so `/assist/mercari`, `/assist/craigslist`, and `/assist/poshmark` use their own target label/create URL instead of always falling back to Facebook metadata.
- Added `docs/MARKETPLACE_POSTING_RESEARCH.md` with source-grounded cross-listing product research.

## Safety posture

Preserved:

- No direct Facebook Marketplace automation.
- No Facebook scraping.
- No cookies, browser profile reuse, login automation, or session handling.
- Facebook/Craigslist/Mercari/Poshmark remain assisted-only: copy fields, open official page, user posts manually, app tracks status/URL.
- eBay/Etsy remain clearly labeled as official API stubs/manual-test paths until real OAuth/API connectors exist.
- No secrets, `.env`, local DB, or build artifacts were intentionally added.

## Baseline / verification commands

### Completed

```bash
npm ci
```

Result: passed after moving the clone from `/tmp` to `/work` because `/tmp` is a 512 MB tmpfs and ran out of space during the first install attempt.

```bash
DATABASE_URL='postgresql://postgres:***@localhost:5432/listing_agent' npx prisma validate
```

Result: passed. Prisma schema valid. Prisma emitted a deprecation warning for `package.json#prisma` config.

```bash
npm run build
```

Result: passed. Next.js compiled successfully, TypeScript completed, and `/more/posting-lab` appeared in the route manifest.

```bash
npm run dev
```

Result: dev server started in mock mode on `http://localhost:3001` because port 3000 was already in use.

HTTP smoke/dogfood via the running dev server:

- `/` → 200
- `/listings` → 200
- `/recommendations` → 200
- `/more` → 200 and contains Marketplace Posting Lab content
- `/more/posting-lab` → 200 and contains Marketplace Posting Lab content
- `/more/automation` → 200
- `/more/audit` → 200
- `/bad-route-for-not-found` → 404
- `/items/itm_udm` → 200
- `/items/itm_udm/review` → 200
- `/items/itm_udm/post` → 200
- `/items/itm_udm/assist/facebook` → 200
- `/items/itm_udm/assist/mercari` → 200
- `/items/itm_udm/assist/nope` → 404

API dogfood:

```bash
POST /api/items/itm_udm/listings { "marketplaces": ["facebook"] }
PATCH /api/items/itm_udm/listings/facebook { "status": "assisted_posted", "externalUrl": "https://example.com/manual-test-listing" }
```

Result: passed in mock mode. The returned Facebook listing had `status: "assisted_posted"` and persisted `externalUrl: "https://example.com/manual-test-listing"` for the running mock process.

### Blocked / not completed

```bash
npm run smoke:persistence
npm run smoke:automation
```

Result: blocked locally because both smoke scripts require `DATABASE_URL` and a seeded Postgres. This container did not have `docker`, `postgres`, `pg_ctl`, or `psql` installed, so I could not start the documented local Postgres service from inside this run. I did run the build and mock-mode HTTP/API checks above.

Browser automation:

- Attempted browser navigation, but Chrome is not installed in this container (`Chrome not found`).
- Used dev-server HTTP checks instead. No browser console evidence was available.

## Bugs found and fixes applied

1. **Assist route marketplace fallback bug**
   - Problem: `app/items/[id]/assist/[marketplace]/page.tsx` always built fallback metadata using `facebook`, so non-Facebook assisted routes could show/open the wrong target metadata.
   - Fix: narrow the requested marketplace with `isAssisted()` and pass that marketplace into `buildAssistedDraft()`.

2. **Manual listing URL was not captured on normal assisted-post completion**
   - Problem: the assist flow had no URL input, and the status path in the PATCH route did not persist `externalUrl`.
   - Fix: added URL input to `AssistActions`; PATCH now applies `updateListingMeta()` with `externalUrl` after a valid status transition.

## Remaining risks

- Full Prisma smoke tests still need a real Postgres environment.
- The lab uses common fields plus lightweight platform tips. More precise platform-specific fields should come next: Poshmark sizing, Mercari shipping, Craigslist location/category, eBay item specifics, Etsy taxonomy/materials.
- Copy buttons require the Clipboard API, so full UX verification should be done in a real browser tomorrow.
- eBay developer docs returned HTTP 403 from this environment; re-check official eBay Sell Inventory docs before connector implementation.

## Next recommended build loops

1. Add seller defaults/preferences: pickup note, shipping policy, return policy, default city/ZIP region, default tags, measurement template.
2. Add a “mark sold everywhere” assisted checklist with URL/status tracking per marketplace.
3. Add export as Markdown/CSV/JSON listing packets for each item.
4. Add platform-specific field maps and validation warnings.
5. Set up a real local/CI Postgres path for scheduled agents so smoke tests can run from cron containers without manual Docker availability.
