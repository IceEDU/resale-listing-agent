# Listing Agent

AI-assisted resale listing agent: a mobile-first PWA that turns photos of stuff you want to sell into ready-to-post marketplace listings, then keeps watching them: prices, health, staleness, and what to do next. Design spec in [DESIGN.md](./DESIGN.md), architecture in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), SaaS strategy in [docs/AI_RESALE_SAAS_STRATEGY.md](./docs/AI_RESALE_SAAS_STRATEGY.md), and competitor notes in [docs/COMPETITOR_RESEARCH.md](./docs/COMPETITOR_RESEARCH.md).

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. No database or API keys needed: without `DATABASE_URL` the app runs on in-memory demo data (resets on restart). For real persistence, see Storage modes below.

## What it does automatically

- Tracks items and their listings across marketplaces in one dashboard.
- Generates listing drafts from photos: title, category, condition, description, per-marketplace copy, keywords, price strategy, negotiation script (mock AI today, swappable interface in `lib/agent`).
- Generates recommendations: price drops, holds, reposts, listing fixes, all with duplicate prevention via fingerprints.
- Tracks price history on every agent, manual, and accepted-suggestion change.
- Checks stale listings and schedules review reminders (`nextReviewAt`).
- Runs self-audits over its own data: price floors, consent records, connector honesty, listing consistency.
- Logs every background job to the database (`/more/automation`).

## What always requires your approval

- Posting to Facebook Marketplace, and any Facebook price change.
- Every Craigslist, Mercari, and Poshmark update.
- Accepting any recommendation. Background jobs only suggest; you accept, the app prepares copy and opens the marketplace, you do the marketplace step, then mark it done.

No scraping, no cookies, no login automation, no faked marketplace success. Facebook, Craigslist, Mercari, and Poshmark have no seller APIs, so they stay assisted-only by design.

## Future true automation

The `MarketplaceConnector` interface (`lib/connectors/`) is ready for official APIs:

- eBay Sell APIs (Inventory, Offer, Fulfillment) once `EBAY_*` credentials and OAuth exist.
- Etsy Open API v3 once `ETSY_*` credentials exist.
- Any future approved connector integration slots in behind the same interface.

Until then the stubs honestly report "not configured" and can never mark a listing live.

## The MVP flow

1. **Dashboard** (`/`): what should I do today: portfolio value, next actions, listings.
2. **New item** (`/new`): photos + consent gate + optional quick questions.
3. **Review** (`/items/[id]/review`): everything the agent drafted; nothing posts without approval.
4. **Post** (`/items/[id]/post`): eBay/Etsy stubs; assisted flow for the rest.
5. **Assist** (`/items/[id]/assist/[marketplace]`): copy fields, photo checklist, open marketplace, mark posted. `?mode=refresh` runs the guided repost version.
6. **For you** (`/recommendations`): suggestion feed with Accept / Dismiss.
7. **More** (`/more`): automation service, self-check, rules, privacy.

## Storage modes

`lib/store.ts` is a facade over two interchangeable backends (`lib/repo/`):

| Mode | When | Persistence |
|---|---|---|
| **Mock** (default) | `DATABASE_URL` missing | In-memory, resets on restart |
| **Prisma** | `DATABASE_URL` set | Postgres, survives restarts |

### Enabling Postgres persistence

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, e.g. local Docker:

   ```bash
   docker run -d --name listing-agent-pg -p 5432:5432 \
     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=listing_agent postgres:16
   # DATABASE_URL="postgresql://postgres:postgres@localhost:5432/listing_agent"
   ```

2. `npm run db:migrate` then `npm run db:seed` (four demo items with deliberate scenarios: price drop, stale repost, hold, fix-the-listing).
3. Restart `npm run dev`.

## Background jobs and cron

Jobs live in `lib/jobs/` and log to the `JobRun` table: `refresh-recommendations`, `check-stale-listings`, `price-drop-suggestions`, `self-audit`. Trigger them from `/more/automation`, via `POST /api/jobs/run {"job": "...", "dryRun": true|false}`, or on a schedule through `GET /api/cron/refresh` (protected by `CRON_SECRET`; `vercel.json` runs it morning and evening). Jobs generate recommendations and audit findings only; they never touch a marketplace. Deployment steps and the env var checklist are in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Deployment notes

Serverless-ready (Vercel or any Node host): no long-lived processes, background work runs through the cron-triggered API route. Short version: provision Postgres, set `DATABASE_URL` and `CRON_SECRET`, run `npx prisma migrate deploy`, deploy; `vercel.json` schedules the cron morning and evening. Full steps and the env var checklist live in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md). Never commit `.env`; see [docs/SECURITY_CHECKLIST.md](./docs/SECURITY_CHECKLIST.md).

## Contributing and CI

- Roadmap: [BUILD_ROADMAP.md](./BUILD_ROADMAP.md) (phases 1 to 10; build in order, nothing ahead of its phase).
- Every PR uses the template checklist: build, schema validation, both smoke tests, mock-mode check, and the safety list (no scraping, no secrets, assisted-only preserved).
- CI (`.github/workflows/ci.yml`) runs on every push and PR: install, `prisma validate`, migrations against a Postgres service, seed, build, and both smoke tests.
- License: placeholder only ([LICENSE](./LICENSE)); replace before the repo goes public.

## Self-check

`lib/audit/self-audit.ts` verifies the app's own promises: listed items have price history, suggestions never go below the floor price, accepted price changes leave a history trail, photos have consent timestamps, assisted listings are not silently stale, and connectors cannot claim a live listing without credentials. Findings show at `/more/audit` with severity info/warning/error; the audit runs from the UI, at the end of smoke tests, and in the cron. The seed data intentionally contains two findings (a 4-week-old stale listing and an eBay listing marked active without credentials) so the audit visibly works.

## Health, verification, and tests

- `GET /api/health`: app status, database reachability, storage mode, last job run, version.
- `npm run smoke:persistence`: CRUD + persistence through a fresh DB connection, then a self-audit. Cleans up after itself.
- `npm run smoke:automation`: job runner idempotence (no duplicate suggestions), price-floor guarantee, stale-listing detection, manual-stats-driven advice flips, self-audit assertions. Cleans up after itself.

## Privacy defaults (do not remove)

- Analysis requires an explicit consent checkbox; the API rejects requests without it.
- Photo storage stub strips EXIF/GPS before persisting; photos stay private.
- No credentials in the repo; `.env.example` contains placeholders only.
- Assisted-post marketplaces are never scraped or automated; the user always taps Post.

## Known limitations

- The AI is a deterministic mock: item recognition, pricing, and copy come from templates, not a model. `lib/agent/index.ts` is the swap point.
- Photos never leave the device; blob storage is stubbed.
- Price history chart is a placeholder sparkline.
- Dismissed suggestions stay suppressed only until the item state changes enough to alter the fingerprint (price, age in weeks, metrics).
- eBay/Etsy connectors are stubs; "active" eBay listings in seed data exist to exercise the self-audit, not to simulate real posts.
- Single demo user; no auth yet.
