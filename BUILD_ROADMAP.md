# Build roadmap

Ten phases from prototype to production. Phase 1 is implemented; everything else is planned only. Global rules that apply to every phase: no scraping, no login automation, assisted-only for Facebook/Craigslist/Mercari/Poshmark, no faked connector success, consent gate stays, and every automated action remains user-approved.

Strategic SaaS direction lives in [docs/AI_RESALE_SAAS_STRATEGY.md](./docs/AI_RESALE_SAAS_STRATEGY.md), with supporting market notes in [docs/COMPETITOR_RESEARCH.md](./docs/COMPETITOR_RESEARCH.md). The product wedge is an AI resale copilot: photo-first item understanding, realistic price ladders, marketplace fit guidance, listing copy, negotiation replies, and safe follow-up recommendations.

---

## Phase 1: GitHub + CI (implemented)

- **Goal**: clean, private-ready repository with automated verification on every push.
- **Exact features**: `.gitignore` covering env files/node_modules/.next/coverage/local DBs/logs, LICENSE placeholder, PR template with verification + safety checklists, bug and feature issue templates, GitHub Actions workflow (install, prisma validate, migrate, seed, build, both smoke tests against a Postgres service), security/secrets checklist, README covering setup/modes/tests/deployment.
- **Files likely affected**: `.gitignore`, `LICENSE`, `.github/**`, `docs/SECURITY_CHECKLIST.md`, `README.md`, `BUILD_ROADMAP.md`.
- **Risks**: committing a secret by accident (mitigated by checklist + gitignore); CI Postgres service flakiness.
- **Verification steps**: `git status` clean of env files, `npm run build`, `npx prisma validate`, `npm run smoke:persistence`, `npm run smoke:automation`; CI green on first push once a remote exists.
- **Do not build yet**: no remote push (waiting for the GitHub URL), no branch protection setup, no release automation.

## Phase 2: Product QA pass

- **Goal**: every existing screen feels finished; no dead ends, confusing states, or silent failures.
- **Exact features**: empty/loading/error states on all pages, form validation messages, 404 pages for bad item/marketplace routes, keyboard and screen-reader pass (labels, focus order), copy review (no jargon), delete-item flow with confirmation, mark-as-sold flow that delists everywhere (recommendation prompt, still user-confirmed per marketplace).
- **Files likely affected**: `app/**` pages, `components/**`, small repo additions (`deleteItem`, `markSold`).
- **Risks**: scope creep into new features; regressions in the assisted flow.
- **Verification steps**: manual flow matrix (new item → review → post → assist → stats → recommendation → repost) in mock and Prisma modes, smokes still green, console clean, a11y spot check with a screen reader.
- **Do not build yet**: no new data models, no real AI, no storage changes.

## Phase 3: Real image storage

- **Goal**: photos actually persist, privately, with the consent contract enforced server-side.
- **Exact features**: private Vercel Blob upload (multipart route), EXIF/GPS stripping on ingest before write, signed short-lived URLs for display, per-photo delete + delete-all-my-photos, `Photo.blobKey` pointing at real blobs, thumbnails on listing cards.
- **Files likely affected**: `app/api/photos/route.ts`, new `lib/photos.ts`, `app/new/page.tsx`, `components/ListingCard.tsx`, item page, `.env.example` (`BLOB_READ_WRITE_TOKEN`), schema unchanged (fields exist).
- **Risks**: privacy regressions (EXIF must be stripped before persistence, not after), storage cost, large-upload handling on serverless limits.
- **Verification steps**: upload → verify blob is private and EXIF-free (download + inspect), consent-off upload rejected, delete purges blob + DB row, smoke test extension covering the consent gate.
- **Do not build yet**: no image recognition (that is phase 4), no public sharing links.

## Phase 4: Real AI agent integration

- **Goal**: replace the mock agent with a real vision + copywriting model behind the existing `AgentService` interface.
- **Exact features**: `lib/agent/real.ts` calling a vision-capable model through an AI gateway (`AI_GATEWAY_API_KEY`), structured output validated against the `AgentListing` schema, mock fallback when the key is missing or the call fails, per-request cost logging, prompt files under `lib/agent/prompts/`.
- **Files likely affected**: `lib/agent/real.ts` (new), `lib/agent/index.ts` (swap point), `lib/agent/types.ts` (unchanged contract), `.env.example`, `docs/ARCHITECTURE.md`.
- **Risks**: hallucinated prices (clamp model prices to comps/floor bounds), cost per listing, latency in the create flow (needs a progress state), schema-invalid model output (validate + retry once + fall back).
- **Verification steps**: golden-item eval set (photos of known items) scored for category/brand accuracy, schema validation tests, mock fallback test with the key unset, smoke tests unchanged and green.
- **Do not build yet**: no comps-based pricing (phase 5 feeds it), no fine-tuning, no training on user data.

## Phase 5: Pricing comps engine

- **Goal**: prices grounded in real sold/active comparables instead of the deterministic mock.
- **Exact features**: eBay Browse API comps fetch (documented public endpoint), `CompsCache` table respecting eBay data-retention terms, `generateInsight` replaced by comps statistics (median/p25/p75, trend), confidence tied to comp count, comps shown in the insight panel ("based on N sold items").
- **Files likely affected**: new `lib/comps.ts`, `lib/insights.ts`, `prisma/schema.prisma` (+`CompsCache`), insight panel component, `.env.example` (eBay app keys for Browse).
- **Risks**: API quota exhaustion (cache + rate limit), retention-term violations (TTL on cache), category mismatch producing bad comps (guard with brand/keyword match score).
- **Verification steps**: unit tests on the stats math, cache TTL test, price floor still enforced end-to-end, smoke price-floor test extended to comps mode.
- **Do not build yet**: no Marketplace Insights API (requires eBay approval, separate application), no automated repricing.

## Phase 6: Browser extension companion for Facebook/eBay page analysis

- **Goal**: cut manual-stats typing: when the user is looking at their own listing, one click imports what is on their screen.
- **Exact features**: MV3 extension (separate `extension/` workspace) with a user-triggered "capture stats" button that reads the currently open page the user is viewing (their own FB listing stats, eBay comp pages), posts to a new authenticated ingest endpoint, maps into `ListingMetric`. Explicitly user-initiated, read-only, foreground-tab only.
- **Files likely affected**: new `extension/**`, `app/api/ingest/route.ts` (new, token-authed), `lib/repo/*` (reuse `addMetric`), docs.
- **Risks**: marketplace ToS gray zone (mitigate: no background polling, no automation, no DOM interaction beyond reading the visible page, user explicitly clicks each time; review store policies before publishing), auth token handling in the extension.
- **Verification steps**: extension never fires without a click (code review + manual test), ingest endpoint rejects unauthenticated calls, imported stats appear in the activity timeline and flip recommendations exactly like manual entry.
- **Do not build yet**: no auto-capture, no posting or clicking on marketplace pages, no message reading.

## Phase 7: Assisted posting polish

- **Goal**: the assisted flow becomes so smooth that manual posting takes under a minute.
- **Exact features**: downloadable photo bundle per listing, per-marketplace field mapper (exact fields each create form asks for, in order), copy-all-in-sequence mode, refresh reminders via `nextReviewAt` surfaced as notifications/badges, listing URL capture prompt after "I posted it", per-marketplace tips (category picker hints).
- **Files likely affected**: `app/items/[id]/assist/**`, `components/AssistActions.tsx`, `lib/connectors/assisted.ts`, BottomNav badge.
- **Risks**: marketplace create-form changes drifting from our field maps (keep maps data-driven).
- **Verification steps**: timed walkthrough per marketplace, listing URL persists to `Listing.externalUrl`, self-audit "no URL on file" findings drop to zero on posted items.
- **Do not build yet**: still zero automation against assisted marketplaces; no prefill via URL parameters unless officially documented by the marketplace.

## Phase 8: Real eBay connector

- **Goal**: first true API automation: publish and sync eBay listings with official APIs, user-approved per action.
- **Exact features**: eBay OAuth flow (routes + encrypted token storage in `MarketplaceConnection`), Sell Inventory publish (createOrReplaceInventoryItem → createOffer → publishOffer), status sync via notifications/polling, delist/reprice actions gated behind accepted recommendations, sandbox mode first.
- **Files likely affected**: `lib/connectors/ebay.ts`, new `app/api/oauth/ebay/**`, `lib/crypto.ts` (token encryption), schema (`MarketplaceConnection` fields exist), post flow UI, self-audit connector checks.
- **Risks**: token leakage (encrypt at rest, minimal scopes), sandbox/production divergence, rate limits, partial-failure states (publish succeeded but offer failed) needing honest status reporting.
- **Verification steps**: full cycle in eBay sandbox (post, reprice, delist, sold sync), self-audit passes with a genuinely configured connector, revoke flow removes tokens, smoke suite extended with a mocked-transport connector test.
- **Do not build yet**: Etsy (next after eBay proves the pattern), no auto-accept of price changes even on eBay.

## Phase 9: Auth / user accounts

- **Goal**: multi-user: each seller sees only their own items; the demo user retires.
- **Exact features**: auth provider (Clerk via Vercel Marketplace, or Auth.js), sign-in/sign-up, all repo queries scoped by `userId`, API routes reject anonymous access, per-user marketplace connections, demo-data import for first-run experience, account deletion (cascade wipe including blobs).
- **Files likely affected**: middleware/proxy, `app/layout.tsx`, every `app/api/**` route, `lib/repo/**` (userId threading), schema already has `User`.
- **Risks**: authorization gaps (an ID-guessing user reading another's items: add ownership checks in every repo method), migration of existing demo data, cron jobs now iterate per user.
- **Verification steps**: cross-user access test (user B cannot read user A's item by ID), smoke tests updated to create their own user, consent + deletion flows re-verified per user.
- **Do not build yet**: no teams, sharing, or roles; no billing.

## Phase 10: Production deployment

- **Goal**: the app runs hosted, monitored, and recoverable, with real users' data safe.
- **Exact features**: Vercel project + Neon Postgres (pooled `DATABASE_URL` + `DIRECT_URL` wired into the datasource), `prisma migrate deploy` in the release step, `CRON_SECRET` set, error tracking, uptime check on `/api/health`, database backups + restore drill, privacy policy page, LICENSE finalized.
- **Files likely affected**: `prisma/schema.prisma` (directUrl), `vercel.json`/project settings, `docs/DEPLOYMENT.md`, new `app/privacy/page.tsx`.
- **Risks**: pooling issues with migrations (that is what `DIRECT_URL` is for), cold-start latency on jobs, seeding demo data into production by accident (guard the seed script), cost monitoring.
- **Verification steps**: staging deploy first, `/api/health` green in production, cron fires on schedule and logs JobRuns, restore-from-backup drill, load sanity check on the dashboard.
- **Do not build yet**: no multi-region, no horizontal scaling work, no mobile app wrappers.
