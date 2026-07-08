# Marketplace agent research

Public-facing patterns from established crosslisting and seller tools, and what this app takes, avoids, or does better. Based on publicly documented features and marketing materials only; no proprietary code or content copied.

## Tools surveyed

| Tool | Public positioning | Patterns worth noting |
|---|---|---|
| Vendoo | Crosslist from one catalog to many marketplaces | Single item record fans out to per-marketplace templates; per-marketplace field mapping; delist-on-sale reminders |
| List Perfectly | Crosslisting with strong templates | Reusable listing templates per category; condition-note library; bulk photo management |
| Crosslist | Browser-based crosslisting | Per-marketplace character/photo limits enforced at draft time; keyword suggestions per platform |
| Flyp | Consignment-style flow for clothing | Price-drop scheduling; automated offer suggestions to likers (on marketplaces with official support) |
| SellerAider | Assistant + relist tooling | Stale-listing detection and relist prompts; quick stats views |
| OneShop | Automation-heavy closet management | Heavy browser automation of marketplaces (see unsafe patterns) |
| eBay Seller Hub / Terapeak | Official eBay analytics | Sold-comps research as the pricing source of truth; sell-through rate as a demand signal |
| Amazon Seller Central / Keepa | Official console + price history | ASIN-first catalog model; gating checks before sourcing; historical price charts driving buy/list decisions |

## Useful patterns to emulate

- One item record, many marketplace-specific drafts (Vendoo/List Perfectly): implemented as `MarketplaceAgent.generateListingCopy` per marketplace.
- Per-marketplace required-field validation before posting (Crosslist): implemented as `validateRequiredFields` with visible "missing before posting" checks.
- Sold-comps as the pricing anchor (Terapeak): mock comps today, roadmap phase 5 makes it real via eBay Browse API.
- Stale detection + relist prompts (SellerAider): already live via the automation engine; the Facebook agent folds repost guidance into its playbook.
- Fee-adjusted per-marketplace pricing (all crosslisters): each agent prices with its marketplace's fee structure so the seller nets the same target.
- Category templates (List Perfectly): implemented as category specialist modules with photo checklists, condition risks, and trust tips.

## Unsafe patterns to avoid (and why)

- Browser automation that posts to Facebook/Poshmark/Mercari on the user's behalf (OneShop-style, parts of several crosslisters): violates marketplace terms, gets accounts banned, requires session cookies. This app never does it: assisted-only, the user posts.
- Session cookie capture / login automation: credential risk plus ToS violation. Never used here.
- Scraping marketplace pages in the background: brittle and against terms. This app relies on user-entered stats instead; the roadmap's extension idea (phase 6) stays user-triggered and read-only-on-screen.
- Faking listing status: some tools show "posted" optimistically before the marketplace confirms. Here a listing is only `assisted_posted` after the user says so, and API listings can never be live while the connector is unconfigured (the self-audit flags it).

## How this app can be better

- Honesty as a feature: connector states, floors, and audit findings are visible; no optimistic fake success.
- Advice, not just plumbing: crosslisters move data; this app's agents explain strategy (negotiation scripts, safe pickup wording, category playbooks) that tools like Vendoo leave to the seller.
- Recommendation loop: stats in, prioritized next actions out; most crosslisters stop at "listed/not listed".
- Local-first economics: Facebook cash sales carry zero fees; the Facebook agent treats that as the default best net, which shipping-first tools underweight.

## Facebook-specific assisted workflow notes

- No public listing API for individual sellers; Commerce Platform APIs are for approved businesses only. Assisted flow is the only compliant option.
- Velocity market: most views arrive in the first 48 hours; renew every 7 days; delete-and-repost with improved title/photo after ~14 quiet days. The agent encodes exactly this.
- Buyers negotiate by default: publishing take/fast/floor tiers plus a negotiation script matters more than on fixed-price marketplaces.
- Stats (views/saves/messages) are visible to the seller in Your Listings but not to apps: manual stats entry is the compliant bridge, and it drives the recommendation engine.

## Amazon / eBay future integration notes

- eBay (roadmap phase 8): official Sell APIs cover the full cycle (Inventory/Offer publish, Fulfillment, notifications). Sandbox first, encrypted OAuth tokens, per-action user approval. Browse API for comps arrives earlier (phase 5).
- Amazon: SP-API is the only legitimate path; requires a professional seller account and app approval. ASIN-first catalog means "generate listing copy" mostly does not apply to used goods: condition notes are the free text. Keepa-style price history is the analog of our price-history chart. Until SP-API credentials exist, the Amazon agent stays advisory and refuses to track listings.
