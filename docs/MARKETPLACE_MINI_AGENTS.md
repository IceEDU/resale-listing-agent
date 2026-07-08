# Marketplace mini-agent foundation

This app uses marketplace/category “mini agents” as strategy profiles, not autonomous marketplace bots. Profiles live in `lib/marketplace-agents.ts` and are intentionally data-only for now so the UI, recommendation engine, and future real AI layer can share the same guardrails.

## Safety contract

- Facebook Marketplace, Craigslist, Mercari, and Poshmark stay **assisted-only**: prepare copy, photo checklist, pricing notes, and a create-page link; the seller posts manually.
- No scraping, cookies, login automation, background polling, or auto-posting on assisted marketplaces.
- eBay/Etsy can become official API connectors only after real credentials/OAuth exist and the API confirms success.
- Amazon is a **future official API research stub** only. Do not create offers or claim listing support until SP-API authorization, eligibility checks, and seller approval are implemented.

## Marketplace agents

- **Facebook Local Agent**: local cash price, fast-sale/take-price spread, title keywords, negotiation wording, safe pickup wording, manual views/saves/messages, and repost cadence.
- **eBay Agent**: sold-vs-active comp strategy, shipping/fee-aware pricing, condition notes, and future Sell API publishing.
- **Etsy Agent**: eligibility for handmade/vintage/supply items, tags/materials, shipping profile, and future Open API support.
- **Craigslist / Local Agent**: short direct copy, city/category fit, pickup safety, and local price bands.
- **Mercari Agent**: shipping tier, offer room, bundle language, and mobile-friendly copy.
- **Poshmark Agent**: brand/style/size keywords, measurements, and offer strategy.
- **Amazon Agent**: ASIN matching, restricted category/brand checks, FBA/FBM notes, and do-not-list warnings. This remains a documented stub until SP-API and eligibility work exists.

## Category specialists

Category profiles cover the seller-specific details that generic copy usually misses:

- Electronics
- Tools
- Bikes & outdoor
- Collectibles
- Clothing & shoes
- Home goods & furniture
- Books & media

Each specialist provides keyword prompts, condition checks, risk flags, and pricing notes. The assisted posting screen now surfaces the marketplace profile, an inferred category specialist from the listing category/title, and a marketplace-specific manual field order. Facebook starts with photos/title/price/category/condition/description/availability/location, including safe public-meetup wording, so the seller gets a smoother posting checklist while preserving the assisted-only safety model.

## Public tooling notes

Safe assisted-posting products like cross-listing tools generally optimize copy reuse, field mapping, and seller workflow. The app should follow that pattern for assisted marketplaces. Official API channels such as eBay, Etsy, and Amazon must stay behind honest connector capability checks instead of simulated success.
