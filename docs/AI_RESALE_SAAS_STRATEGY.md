# AI Resale SaaS Strategy

This document turns the current Listing Agent prototype into a focused SaaS product direction.

## Product thesis

Listing Agent should not try to become another generic crosslisting tool first. The stronger wedge is an **AI resale copilot** for casual sellers and part-time flippers:

> Take photos, understand the item, choose the best marketplace, price it realistically, generate platform-specific listing copy, help negotiate with buyers, and remind the seller what to do next.

The product should sell the outcome: turning unused or sourced inventory into cash faster with less manual work.

## Recommended positioning

### Primary positioning

**AI Resale Copilot**

For people who sell across Facebook Marketplace, eBay, Mercari, Poshmark, Craigslist, and Etsy, but do not want to become marketplace power users.

### Homepage headline candidates

- Take a photo. Know the price. Post with confidence.
- Your AI copilot for turning clutter into cash.
- List faster, price smarter, and stop letting stale inventory sit.
- Marketplace listings written, priced, and ready in under a minute.

### Best initial promise

> Upload a few photos and get a ready-to-post listing, realistic price ladder, marketplace recommendation, and buyer reply scripts.

## Target customers

### Best beachhead: part-time local flippers

Examples:

- clearance/tool flippers
- Facebook Marketplace sellers
- people selling garage, furniture, electronics, bikes, and household items
- eBay/Mercari sellers who do not yet want full enterprise crosslisting software

Why this segment:

- repeat usage is higher than one-time garage cleanout users
- willingness to pay is higher than casual sellers
- existing tools are often too broad, too expensive, or too automation-heavy
- local-price and negotiation help are underserved

### Secondary customer: casual sellers

Examples:

- someone cleaning out a room, garage, or storage unit
- someone who wants help pricing and writing listings but does not need inventory management

This segment is good for a free tier and viral sharing, but weaker for subscription revenue.

### Later customer: power resellers

Power sellers expect bulk import, crosslisting reliability, sale detection, analytics, auto-delist, and team workflows. This should be served later, not first.

## Differentiation

The market already has mature crosslisting tools. Listing Agent should differentiate on agent judgment and safe workflow design.

### Compete on

- photo-first item understanding
- sell-fast local pricing
- price ladders: list, target take, fast-sale, hard floor
- marketplace fit recommendations
- buyer negotiation replies
- stale listing recommendations
- category-specialist guidance
- safe assisted posting for platforms without official seller APIs

### Do not compete first on

- full autoposting to every marketplace
- Poshmark bot behavior
- CAPTCHA solving
- scraping Facebook or using account cookies
- unofficial marketplace APIs
- Amazon SP-API automation before the product has auth, billing, and compliance maturity

## Core product loop

```text
1. Seller uploads 3–6 photos.
2. Agent identifies the item and asks only critical missing questions.
3. Agent recommends marketplaces and pricing strategy.
4. Seller reviews platform-specific title, description, tags, photo checklist, and negotiation replies.
5. Seller posts through assisted flow or official API connector where available.
6. App tracks listing status, manual stats, price history, and next actions.
7. Background jobs recommend price drops, reposts, copy fixes, and stale-listing actions.
```

## Agent architecture

Build this as several specialized strategy modules rather than one generic prompt.

### Vision Identification Agent

Inputs:

- item photos
- optional user notes
- optional barcode/model number

Outputs:

- likely item type
- brand/model candidates
- category
- condition assumptions
- missing questions
- confidence score

### Category Specialist Agent

Adds category-specific checks and risks.

Examples:

- **Tools:** tool-only vs kit, battery/charger, model number, brushless/brushed, tested status
- **Electronics:** model number, storage/capacity, locks/accounts, cables, battery health, serial privacy
- **Furniture:** dimensions, pickup logistics, material, condition, local demand
- **Clothing/shoes:** size, measurements, flaws, authenticity risk
- **Collectibles/books/media:** edition, grading, ISBN/UPC, authenticity/comps

### Pricing Agent

Outputs:

- aspirational list price
- target take price
- fast-sale price
- hard floor
- expected days to sell
- confidence
- evidence/comps used

For local resale, this should be more useful than a single “fair value” estimate.

### Marketplace Fit Agent

Ranks channels by item type, shipping difficulty, demand, fee risk, local pickup fit, and sale speed.

Example output:

```text
Best: Facebook Marketplace
Secondary: eBay if willing to ship
Skip: Etsy and Amazon
Reason: local tool demand is strong; shipping erodes margin unless bundled.
```

### Listing Copy Agent

Creates marketplace-specific versions:

- Facebook: short, local, direct, pickup-friendly
- Craigslist: concise, local, safety-aware
- eBay: keyword-rich, condition-specific, shipping clarity
- Mercari/Poshmark: mobile-friendly, brand/condition/style keywords
- Etsy: vintage/handmade/supply positioning only when appropriate

### Negotiation Agent

Generates reusable buyer replies:

- “Lowest?”
- lowball counter
- pickup-today close
- hold/deposit refusal
- availability confirmation
- safe meetup wording

This is a high-value feature because seller messaging is a major friction point.

### Follow-up Agent

Uses listing age, manual stats, price history, and buyer interest to recommend:

- price drops
- reposts/refreshes
- first-photo improvements
- title/keyword edits
- reply reminders
- stale listing cleanup

## Safe marketplace integration rules

### Official API automation allowed later

- eBay: official Sell APIs after OAuth and sandbox verification
- Etsy: Open API v3 after OAuth and app approval/commercial access where required

### Assisted-only marketplaces

For Facebook Marketplace, Craigslist, Mercari, and Poshmark until a safe official integration is available:

1. Generate platform-specific fields.
2. Show required-field checklist.
3. Provide copy buttons.
4. Open the official marketplace page.
5. User posts/updates manually.
6. User pastes URL and marks posted/refreshed.
7. App tracks status and manual stats.

Do not request passwords, OAuth codes, cookies, localStorage, or session tokens. Do not automate login, scrape gated pages, or claim posting success without user confirmation or official API response.

## SaaS dependency order

Build SaaS infrastructure in this order:

1. **Auth and tenant scoping** — every item, listing, recommendation, connection, and job must belong to a real user.
2. **Private persistence and storage** — Postgres plus private photo storage with EXIF/GPS stripping.
3. **Real AI agent** — structured output, confidence, fallback, and cost logging.
4. **Pricing/comps engine** — eBay first; cache with retention limits.
5. **Billing and limits** — Stripe subscriptions, AI credits, active item caps.
6. **Production launch** — Vercel/Node host, Postgres, health checks, privacy policy, monitoring, backups.
7. **Official connectors** — eBay first, Etsy second; sandbox before production.

Auth comes before billing. Billing comes before plan enforcement. Official connectors come after the core assisted product is safe and useful.

## Suggested pricing

Start simple.

| Tier | Price | Best for | Limits/features |
|---|---:|---|---|
| Free | $0 | casual testing | 5 active items, limited AI drafts, assisted Facebook/Craigslist flow |
| Pro | $19/mo | part-time flippers | 100 active items, AI drafts, marketplace templates, price ladders, stale reminders, negotiation replies |
| Power Seller | $39/mo | heavier resellers | 500 active items, bulk tools, CSV export, advanced analytics, eBay/Etsy connectors when ready |

Later expansion:

- $99/mo team/agency tier
- pay-as-you-go AI/comps credits
- listing audit service or done-with-you resale optimization

## MVP success metrics

Track these before adding broad automation:

- time from photos to ready listing
- percentage of drafts edited by the user
- percentage of items marked posted
- percentage with pasted listing URL
- stale-listing recommendations accepted
- price-drop recommendations accepted
- number of buyer replies copied
- activation: first item created and posted
- retention: user returns to update stats or create another listing within 7 days

## Near-term implementation plan

### Phase 1: SaaS auth foundation

- Add auth provider.
- Protect app routes.
- Thread real `userId` through repo methods and API routes.
- Add ownership checks for item/listing/recommendation access.
- Keep demo/mock mode for local testing.
- Add cross-user isolation tests or smoke checks.

### Phase 2: Product onboarding

- Ask what the user sells.
- Ask main marketplaces.
- Ask local pickup vs shipping.
- Ask fast sale vs max profit preference.
- Save default pricing/marketplace preferences.

### Phase 3: Real photo storage

- Private upload route.
- EXIF/GPS stripping before storage.
- Signed display URLs.
- Delete photo and delete account data flows.

### Phase 4: Real AI agent

- Vision-capable model behind `AgentService`.
- Structured JSON validation.
- Confidence and missing-question logic.
- Mock fallback when API key is absent or request fails.

### Phase 5: Pricing/comps

- eBay comps first.
- Cache comp results with TTL.
- Price ladder UI.
- Confidence tied to comp count and category match.

### Phase 6: Billing

- Stripe checkout and portal.
- Subscription status in user/account model.
- Enforce active item and AI draft limits.

## Strategic note

The safest, most defensible product is not “we automate every marketplace.” It is:

> We help you make better resale decisions and move faster, while keeping risky marketplace actions user-approved or official-API-only.

That positioning avoids fragile bots and gives the product room to become more automated where platforms support it.
