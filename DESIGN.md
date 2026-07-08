# Listing Agent — Marketplace Item Management Dashboard with AI Pricing Insights

Design document, v0.1 — 2026-07-06

A single dashboard where a seller photographs an item with their phone, gets AI-driven pricing insights (estimated price, price range, trend, sell-ability, projected sell time), and posts to multiple marketplaces from one place.

---

## 1. High-level system architecture

**Client** — Responsive web app / PWA (works on any smartphone browser; camera access via standard `<input type="file" capture>` — no special hardware). Dashboard, photo capture, listing editor, insights panel.

**API backend** — Next.js route handlers on Vercel (Fluid Compute). Handles auth, consent gating, photo intake, orchestration of AI calls and marketplace connectors.

**Storage**
- **Photos**: Vercel Blob, *private* access mode. Photos are stored only after the user grants explicit upload consent; EXIF/GPS metadata stripped on ingest.
- **Database**: Postgres (Neon via Vercel Marketplace). Tables: `users`, `items`, `photos` (blob refs + consent record), `listings` (one row per item × marketplace), `insights` (AI outputs, versioned), `comps_cache`, `oauth_tokens` (encrypted at rest).
- **Jobs**: Vercel Queues + cron for listing sync, scheduled price drops, relist, comp refresh.

**AI services** (via Vercel AI Gateway)
- **Vision model** — extracts item identity from photos (category, brand/model, condition cues, attributes) and drafts title/description.
- **Pricing model** — price prediction model trained on historical marketplace sales (placeholder: [FILL: model details]; data source: [FILL: data source]). Combines statistical comps analysis with the trained model.

**Marketplace connectors** — one adapter per marketplace behind a common `Connector` interface (`createListing`, `updateListing`, `endListing`, `getStatus`, `fetchComps` where supported). Only documented, public endpoints — see §5.

---

## 2. Feature list

| Feature | Description |
|---|---|
| Snap & list | Photograph item from phone; AI pre-fills category, title, description, condition. User confirms/edits — AI never posts without review. |
| AI pricing insights | Per item: estimated selling price, price range (low/high), 90-day price trend, sell-ability score (0–100), projected time to sell, confidence level. |
| Cross-posting | One tap posts to selected marketplaces (eBay, Etsy fully automated; Facebook Marketplace via assisted-post flow — see §5). |
| Unified listing board | All listings across marketplaces in one view: status (draft / active / sold / stale), views, watchers, offers. |
| Auto upkeep | Rules engine: scheduled price drops (e.g. −5% every 14 days to floor price), auto-relist expired, auto-delist everywhere when sold anywhere (prevents double-selling). |
| Stale listing nudges | Flags items sitting past projected sell time with a suggested new price. |
| Offer inbox | Aggregated offers/messages links per marketplace (deep links into each platform's own messaging — we don't proxy buyer messages). |
| Sales analytics | Simple totals: revenue, avg days to sell, best categories. Plain language, no jargon. |

## 3. AI model inputs and outputs

**Vision model**
- In: user photos (only with consent), optional user hint text.
- Out: `{ category, brand, model, attributes[], condition_estimate, title_draft, description_draft, photo_quality_tips }`.

**Pricing model** (placeholder: [FILL: model details])
- In: `{ category, brand, model, condition, attributes, comps: [{price, sold_date, condition, platform}], season/month, target_platforms }`.
- Comps source: eBay Browse API (active listings) + Marketplace Insights API (sold data, limited-access — see §5) + own accumulated sales history ([FILL: data source]).
- Out: `{ estimated_price, range: {low, high}, trend_90d_pct, sellability_score, projected_days_to_sell, confidence, explanation }`. The `explanation` is one plain-English sentence shown to the user ("Similar phones sold for $180–$220 in the last month; prices are drifting down ~3%").

## 4. UI wireframe outline

Main flow (use exactly as reference layout): **Photo upload → Item details → AI pricing insight panel → Marketplace posting options**

**Dashboard (home)**
- Header: logo, "+ New item" button, settings.
- Stats strip: Active listings · Est. total value · Sold this month · Needs attention.
- Listing cards grid: photo thumbnail, title, price, per-marketplace status chips, insight badge ("Likely to sell in ~9 days").
- Filter tabs: All / Active / Drafts / Stale / Sold.

**New item flow (single screen, vertical on mobile)**
1. Photo upload — big camera/drop zone, up to N photos, consent checkbox inline ("Analyze and store these photos — you can delete anytime").
2. Item details — AI-prefilled title, category, condition, description; every field editable.
3. AI pricing insight panel — estimated price (large), range slider (low–high), trend sparkline, sell-ability meter, "sells in ~X days" chip, one-sentence explanation. Price field pre-set to estimate; user drags/edits freely.
4. Marketplace posting options — toggle per connected marketplace; eBay/Etsy show "posts automatically", Facebook shows "opens pre-filled draft". "Post" button.

**Item detail page** — photos, current insights (refreshable), per-marketplace status, price-drop rule editor, activity log.

## 5. Marketplace integration plan (documented endpoints only)

| Marketplace | Auth | Listing creation | Comps / sold data | Notes |
|---|---|---|---|---|
| eBay | OAuth 2.0 (user consent, minimal scopes) | Sell Inventory API (`createOrReplaceInventoryItem`, `createOffer`, `publishOffer`) | Browse API (active comps); Marketplace Insights API for sold data — **limited-access, requires eBay approval**; fall back to Browse-only + own history if not granted | Fulfillment API + notifications for sold/status sync. Credentials: [FILL: API credentials and documentation] |
| Facebook Marketplace | — | **No public API for individual sellers.** Commerce Platform APIs exist only for approved business partners. | None public | Assisted-post flow: we generate the listing (photos, title, description, price) and open Marketplace's create page / share sheet with content on the clipboard; user pastes and posts in ~15s. Status tracked manually ("Mark as posted / sold"). Honest UI copy: "Facebook requires you to tap Post yourself." |
| Etsy | OAuth 2.0 | Open API v3 (`createDraftListing`, listing images endpoint) | Own history only | Good second automated channel for handmade/vintage. |
| Mercari, Poshmark, Craigslist, OfferUp | — | No public APIs | — | Same assisted-post pattern as Facebook: pre-filled export + copy helpers. Never scrape or automate against ToS. |

Connector interface keeps adapters swappable; if a platform later opens an API, only the adapter changes.

## 6. Data flow

1. User snaps photos → consent checkbox → upload to private Blob (EXIF stripped).
2. API sends photo refs + consent token to vision model via AI Gateway → item attributes + draft copy.
3. Comps service queries eBay Browse (+ Insights if approved) using extracted attributes; caches results in `comps_cache` (respecting eBay data-retention terms).
4. Pricing model receives attributes + comps → insights stored in `insights`, rendered in panel.
5. User reviews/edits → selects marketplaces → Post.
6. Queue job per marketplace: API connectors post directly; assisted-post platforms get a prepared draft handoff.
7. Webhooks/polling update `listings` status; sold-anywhere triggers delist-everywhere job; analytics update.

## 7. Privacy & simplicity recommendations

**Privacy**
- Photos never stored or sent to AI without an explicit, per-upload consent step; one-tap "Delete my photos" purges Blob + DB refs.
- Private blob storage only; signed, short-lived URLs for the user's own session.
- Strip EXIF/GPS on ingest — home-photo location data never leaves the device's upload.
- User content never used to train models without separate opt-in.
- OAuth tokens encrypted at rest, minimal scopes, revocable from settings ("Disconnect eBay").
- Plain-language privacy page: what's stored, where, how to delete — no legalese wall.

**Simplicity**
- One primary action per screen; the whole list flow is a single vertical page.
- No jargon: "Likely to sell in about 9 days", never "P(sale|30d)=0.82".
- Defaults everywhere: AI pre-fills all fields; user can post with two taps but can edit anything.
- Show confidence honestly: low-confidence estimates say "Rough estimate — few similar sales found."
- Progressive disclosure: price-drop rules, analytics, per-platform tweaks live behind "More options".

## 8. Onboarding flow (ease-of-use first)

1. Sign up (email or OAuth) → 2. "Connect a marketplace" (eBay OAuth, big button; skippable) → 3. "Snap your first item" guided capture with framing tips → 4. Insights appear → "Post it". Total: under 3 minutes; no forms about shipping policies etc. until first eBay post requires them (then pulled from eBay account defaults).

## 9. Open items / placeholders

- [FILL: API credentials and documentation] — eBay dev account + Marketplace Insights access application.
- [FILL: data source] — historical sales bootstrap dataset for pricing model.
- [FILL: model details] — pricing model choice (start: gradient-boosted regressor over comp statistics; upgrade path: fine-tuned model as own sales data accumulates).

## Execution checklist

- [x] Identify required marketplace API endpoints (§5).
- [x] Define AI model inputs and outputs (§3).
- [x] Sketch dashboard wireframes (§4).
- [x] Outline data flow and storage considerations (§1, §6).
- [x] Draft user onboarding flow emphasizing ease of use (§8).
