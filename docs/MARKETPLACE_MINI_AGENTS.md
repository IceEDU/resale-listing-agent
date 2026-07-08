# Marketplace agent playbook

This project uses marketplace-specialist and category-specialist mini-agent profiles to guide research, pricing, listing copy, and safe posting strategy. The implementation lives in `lib/marketplace-agents.ts`; the in-app reference screen is `/more/agents`.

## Safety model

- **Facebook Marketplace, Craigslist, Mercari, and Poshmark stay assisted-only.** The app may prepare copy, a field checklist, photo checklist, pricing notes, manual stat prompts, and a create-page link. The seller posts, edits, refreshes, and marks sold manually.
- **No scraping, cookies, login automation, background polling, or auto-posting** for assisted marketplaces.
- **eBay and Etsy are official-API targets only when credentials exist.** Until then, connectors must report an honest draft/not-configured state.
- **Amazon is research-only for now.** Do not create offers, claim eligibility, or simulate SP-API success without seller authorization, SP-API credentials, and eligibility checks.

## Public source notes checked this tick

- Facebook developer Marketplace docs are publicly reachable, but the app still treats consumer Marketplace posting as assisted-only because there is no safe public individual-seller auto-posting path: https://developers.facebook.com/docs/marketplace/
- eBay selling automation belongs behind documented Sell APIs and OAuth: https://developer.ebay.com/api-docs/sell/static/sell-landing.html
- Amazon future work belongs behind the Selling Partner API and seller eligibility flow: https://developer-docs.amazon.com/sp-api/
- Etsy publishing belongs behind Open API v3 credentials and seller authorization: https://developer.etsy.com/documentation/

## Channel mini-agents

### Facebook Local Agent

Focus on local cash value, search-heavy titles, public meetup wording, negotiation room, and manual stats: views, saves, messages, and listing age. Use assisted repost/refresh recommendations only after user-entered stats or stale age support it.

### eBay Agent

Focus on sold-vs-active comps, shipping dimensions, fee-aware net, condition notes, and official Sell API readiness. It may prepare strategy before credentials exist, but cannot mark a listing live without API confirmation.

### Amazon Agent

Focus on ASIN matching, restricted/gated categories, hazmat risk, FBA/FBM notes, Buy Box context, and do-not-list warnings. Current product behavior should remain a planning/research stub only.

### Mercari / Poshmark Agent

Focus on mobile-friendly copy, shipping/fee sensitivity, brand/style/size details, bundle friendliness, and offer room. Posting remains manual.

### Craigslist / Local Agent

Focus on direct copy, local category choice, pickup safety, cash terms, and avoiding private home-address exposure.

## Category mini-agents

Current category specialists cover electronics, tools, bikes/outdoor, collectibles, clothing/shoes, home goods/furniture, and books/media. Each specialist contributes keyword prompts, condition checks, risk flags, and pricing notes that can be surfaced in assisted posting and future comp research.

## Implementation notes

- Keep the profile data deterministic and reviewable; it is product policy as much as UX copy.
- Add new marketplaces as profiles first, then connector behavior second.
- Add new categories by extending `CategoryAgentId`, `CATEGORY_AGENT_PROFILES`, and `CATEGORY_MATCHERS` together.
- If a marketplace changes policy or exposes a real official seller API, update docs first, then code, then connector tests.
