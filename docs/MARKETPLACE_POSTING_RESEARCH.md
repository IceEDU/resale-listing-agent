# Marketplace posting research

Research date: 2026-07-08. Scope: public-facing feature and documentation pages only. This is product/UX research, not code copying.

## Safety line for this repo

- Do **not** automate Facebook Marketplace posting.
- Do **not** scrape Facebook or use cookies, browser profiles, login automation, or account-session tricks.
- Facebook, Craigslist, Mercari, and Poshmark stay **assisted-only**: prepare copy, open the official marketplace page, user manually posts/updates, app tracks the URL/status afterward.
- eBay and Etsy can become true connectors only through official OAuth/API work. Until then, they must report honest “not configured” / manual-test behavior.

## Sources reviewed

- Vendoo homepage: <https://www.vendoo.co/>
- List Perfectly homepage: <https://listperfectly.com/>
- Crosslist homepage: <https://crosslist.com/>
- Flyp homepage: <https://www.flyp.com/>
- SellerAider homepage: <https://selleraider.com/>
- Zipsale homepage: <https://www.zipsale.co.uk/>
- OneShop homepage: <https://oneshop.com/>
- Etsy Open API v3 docs: <https://developer.etsy.com/documentation/>
- eBay Seller Hub public page: <https://pages.ebay.com/seller-center/listing-and-marketing/seller-hub.html>

Some eBay developer documentation pages returned HTTP 403 from this environment, so eBay API conclusions here are limited to the repo’s existing connector intent plus public seller tooling pages. Re-check official eBay Sell Inventory docs in a browser before implementing the real connector.

## Comparable product patterns

### Vendoo

Public positioning emphasizes cross-listing, sale detection/auto-delist, bulk actions, inventory management, multi-quantity support, offers, analytics, mobile app support, marketplace sharing, size chart, fee calculator, and profit margin calculator.

**Useful patterns to emulate**

- Central inventory object that feeds many marketplace drafts.
- Bulk action mental model: list, relist, delist, mark sold, refresh.
- Profit/fee visibility before posting.
- Sale/delist tracking as a status workflow, not a hidden automation.

**Avoid / keep constrained**

- Anything that implies automatic direct posting to marketplaces where the app has no approved API.
- Silent delisting without an explicit user action unless a real official connector supports it.

### List Perfectly

Public homepage highlights an AI-powered listing assistant that creates listing titles, descriptions, keywords/tags, and item specifics from photos; unlimited crosslisting; bulk import/crosslist/delist/relist/mark sold; catalog inventory/image management; auto sales detection/delist; pricing research; background removal; inventory tracking and backup.

**Useful patterns to emulate**

- “Snap → draft → review → crosslist” flow.
- Generated item specifics and keywords alongside the title/body.
- Catalog-first design: marketplace posts are projections of one canonical listing.
- Bulk copy/export bundles so a seller can move quickly.

**Avoid / keep constrained**

- Do not over-promise auto sales detection across marketplaces unless the repo has official connectors or user-entered status.
- Background removal and pricing research are separate future loops; don’t fake them.

### SellerAider

Public homepage describes crosslisting, inventory management, Chrome tooling, turning photos into listings, image editing, price finding, filling details, and shop growth automation. It also notes use of Etsy/eBay APIs without endorsement/certification.

**Useful patterns to emulate**

- Clear “not affiliated / not endorsed” connector language.
- Photo-to-listing draft generation with price and detail fields.
- Marketplace-specific field mapping, especially the order sellers encounter fields.

**Avoid / keep constrained**

- Browser-extension or autofill work should stay future-scoped and user-initiated only. No background marketplace automation.

### Zipsale

Public page emphasizes crosslisting software for resellers, keeping track of product listings across multiple marketplaces, easy cross-posting, and automatic delisting to prevent duplicate sales.

**Useful patterns to emulate**

- Queue/status board per marketplace: draft, ready, posted, active, stale, sold/delisted.
- Duplicate-sale prevention via prominent “mark sold everywhere” workflow.
- Tracking where each listing lives with external URLs.

**Avoid / keep constrained**

- Automatic delisting is safe only for official connectors. Assisted marketplaces need an “open marketplace and delist manually” checklist.

### OneShop

Public homepage highlights unified sales graphs/goals, drafting once then listing everywhere, importing from another site, smart autofill, description templates, listing preferences, and repetitive work such as relisting/bumping/sharing.

**Useful patterns to emulate**

- One canonical draft with marketplace-specific templates.
- Seller preferences/defaults to reduce repeated typing.
- A goal-oriented dashboard: “what should I do next?”

**Avoid / keep constrained**

- Repetitive marketplace actions like sharing/bumping are risky without approved APIs; represent them as reminders/checklists for assisted marketplaces.

### Etsy official API

Etsy Open API v3 documentation supports app developers building tools to integrate with and automate Etsy shop/customer processes. It requires app registration, API key/shared secret, OAuth/scopes, compliance with API terms, caching policies, and commercial access review criteria.

**Useful patterns to emulate**

- Explicit connector state: not configured, sandbox/test, live.
- OAuth/credentials gate before any “publish” action.
- Terms/caching compliance notes in connector docs.

**Avoid / keep constrained**

- Never mark Etsy posting successful unless the official API call really succeeded.

### eBay seller tooling

The public Seller Hub page reinforces eBay’s official seller workflow. The repo already plans eBay Sell API work in a future phase.

**Useful patterns to emulate now**

- Manual sell-page handoff while API credentials are absent.
- Future official connector should separate inventory item creation, offer/publish, fulfillment/shipping, and sync states.

**Avoid / keep constrained**

- No fake eBay connector success. Manual test links are okay; API publish waits for OAuth/app credentials.

## Product foundation recommendations for this repo

Implemented in this branch:

1. **Marketplace Posting Lab** at `/more/posting-lab`.
   - Select a demo item.
   - See a per-marketplace posting card.
   - Copy individual fields or a full platform bundle.
   - Route assisted marketplaces into the existing guided assist page.
   - Keep eBay/Etsy clearly labeled as official API stubs/manual-test paths.

2. **Marketplace field validation.**
   - Each platform plan computes missing required fields.
   - The lab reports whether a card is ready to copy, missing info, or API-stub/manual-test.

3. **Listing URL capture in assisted flow.**
   - After manual posting, paste the public listing URL before marking posted/refreshed.
   - The API stores the URL through existing listing metadata.

4. **Bug fix: assisted marketplace label/URL.**
   - The dynamic assist page now uses the requested marketplace instead of always using Facebook fallback metadata.

## Next recommended loops

1. Add seller preferences/defaults: location note, pickup/shipping preference, return policy, default hashtags, and measurement templates.
2. Add a “mark sold everywhere” assisted checklist that opens each active marketplace and records completion.
3. Add platform-specific field maps beyond the common fields: size/measurements for Poshmark, shipping for Mercari/eBay, city/category for Craigslist, item specifics for eBay/Etsy.
4. Add import/export of a single listing packet as Markdown/CSV/JSON for manual testing and later official connector tests.
5. Add official eBay sandbox connector tests only when credentials and OAuth scaffolding are available.
