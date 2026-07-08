# Design Refresh + Automation Engine v1

Status: implemented, 2026-07-06. Code references point at the live files.

The app graduates from listing tracker to resale command center: a premium dark mobile UI, a listing health score, price history, manual marketplace stats, and an automation engine that generates user-approved recommendations. Assisted marketplaces (Facebook, Craigslist, Mercari, Poshmark) stay assisted only: the app prepares content, the user posts and updates. eBay/Etsy remain honest connector stubs behind the same interface a real API integration will use.

## Design tokens

Defined in `app/globals.css` as component classes plus Tailwind utilities. Dark theme only.

| Category | Token | Value |
|---|---|---|
| Color, background | page | `zinc-950` (#09090b) with two fixed radial gradients, blue 8% and violet 7% |
| Color, surface | `.card` | `zinc-900/70` on `border-white/10` |
| Color, accent | primary gradient | `blue-500` to `violet-500` (buttons, FAB, highlights) |
| Color, text | primary / secondary / muted | `zinc-100` / `zinc-400` / `zinc-500` |
| Status colors | active, draft, stale, sold | emerald, zinc, amber, sky (each `*-400/10` bg + `*-300` text) |
| Marketplace colors | eBay, Etsy, FB, CL, Mercari, Posh | amber, orange, blue, purple, rose, pink (same tint pattern) |
| Health colors | Strong, Good, Needs Work, Poor | emerald, blue, amber, red |
| Spacing | card padding | 16px (`p-4`); page gutter 16px; section gap 24px |
| Radius | cards / controls / chips | 16px (`rounded-2xl`) / 12px (`rounded-xl`) / full |
| Shadows | FAB only | `shadow-lg shadow-blue-500/25`; cards stay flat |
| Typography | h1 24px semibold tight; section labels 12px uppercase `tracking-wider`; body 14px | |
| Touch targets | buttons `py-3.5` (about 48px); nav FAB 56px | |

## UI components

| Component | File | Purpose, key props, behavior |
|---|---|---|
| AppShell | `app/layout.tsx` | Sticky translucent header with gradient wordmark, `max-w-2xl` column, bottom padding for nav. |
| BottomNav | `components/BottomNav.tsx` | 5 tabs: Home, Listings, Sell (center gradient FAB), For you, More. Active state from `usePathname`, safe-area inset aware. |
| ListingCard | `components/ListingCard.tsx` | Props `{item}`. Photo block, title, current price plus `rec $X`, status chip, marketplace chips, health ring, contextual quick action (Review & post / Fix price / Manage / Details). |
| StatsStrip | `components/StatsStrip.tsx` | Props `{items, recommendations}`. Gradient hero card: portfolio value, active/draft/stale/sold counts, pending suggestions badge. |
| MarketplaceStatusChip | `components/MarketplaceStatusChip.tsx` | Props `{listing}`. Marketplace color + human status label ("FB · posted by you"). |
| PriceStrategyCard | `components/PriceStrategyCard.tsx` | Props `{pricing}`. Four tiles (max profit, realistic, fast sale, floor), goal tile highlighted, min-take line. |
| ListingHealthScore | `components/ListingHealthScore.tsx` | Props `{health}`. SVG ring (also exported as `HealthRing` for cards), label, fixes as amber bullets, strengths as green checks. |
| AutomationRuleCard | `components/AutomationRuleCard.tsx` | Props `{rule}`. Rule label, description, "suggests only" disclaimer. Shown on More page and review screen. |
| ActivityTimeline | `components/ActivityTimeline.tsx` | Props `{item}`. Merged, dated feed of price changes (blue), logged stats (green), resolved recommendations (amber). |
| RecommendationCard | `components/RecommendationCard.tsx` | Props `{rec}`. Priority + type chips, message, Accept / Dismiss. After accept: copy new price, open assisted marketplace, "I updated it manually" marks done. Dismissed/done render collapsed. |
| PriceHistoryChart | `components/PriceHistoryChart.tsx` | Props `{history}`. Placeholder SVG sparkline over recorded points; swap for a chart lib later. |
| ManualStatsForm | `components/ManualStatsForm.tsx` | Props `{itemId, marketplaces}`. Views / saves / messages / listing URL / notes. Saving triggers a recommendation refresh for the item. |

Navigation: Dashboard `/`, Listings `/listings` (filter pills), New Item `/new`, Recommendations `/recommendations`, More `/more` (automation rules, privacy, storage mode).

Dashboard answers "what should I do today?": hero value card, top 3 pending recommendations by priority, recent listing cards.

## Data models

App types in `lib/types.ts`, Prisma models in `prisma/schema.prisma` (uppercase enums).

```
PriceHistory  { id, itemId, listingId?, marketplace?, price, source: agent|user|connector|manual, reason, createdAt }
ListingMetric { id, itemId, listingId?, marketplace?, views, saves, messages, listingUrl?, notes?, createdAt }
AutomationRule{ id, itemId? (null = global), type, label, description, enabled, config Json, createdAt, updatedAt }
Recommendation{ id, itemId, listingId?, marketplace?, type: price_drop|repost|fix_title|fix_photos|hold|refresh_keywords,
                priority: high|medium|low, message, suggestedAction Json ({newPrice?}),
                status: pending|accepted|dismissed|done, createdAt, updatedAt }
Health (computed, not stored) { score 0-100, label, reasons[], fixes[] }
```

Price history is written when: the agent prices a new item (agent), the user edits price in the item form (user), the user accepts a price-drop recommendation (user), and later when a connector confirms a change (connector).

## Health score logic

`lib/health.ts`, pure function of the item. Additive points, clamped 0 to 100; sold items are 100.

| Factor | Points |
|---|---|
| Title has 4+ words (keyword coverage) | +15 |
| Brand in title +5; digits (model number) in title +10 | +15 |
| Description 80+ chars | +15 |
| 3+ photos | +15 |
| Condition set | +5 |
| Price inside suggested range | +15 |
| Live on 2+ marketplaces +15 (one +10) | +15 |
| Not older than projected sell time | +10 |
| Stats logged within 7 days | +5 |

Labels: 0-39 Poor, 40-69 Needs Work, 70-89 Good, 90-100 Strong.

Example output (seeded UDM drill):

```json
{
  "score": 50,
  "label": "Needs Work",
  "reasons": [
    "Price sits inside the suggested range",
    "Fresh marketplace stats on file"
  ],
  "fixes": [
    "Add more descriptive keywords to the title",
    "Title missing model number",
    "Description is thin, add condition and measurements",
    "Only 1 photo, add at least 3",
    "Only on one marketplace, cross-post to sell faster"
  ]
}
```

Shown as a ring on every listing card and as a full panel on the item page and agent review screen.

## Automation behavior

Engine: `lib/recommendations.ts`, pure `(item, now) -> drafts`. Default strategies (`lib/automation.ts`, seeded into `AutomationRule`):

1. No messages after 5 days: suggest an 8 percent price drop, never below the floor price.
2. Facebook listing older than 14 days: suggest repost/refresh (message includes weeks listed).
3. Recent messages (within 7 days): suggest holding the price.
4. Weak title or photos: suggest fixing the listing before any price move (suppresses price rules).
5. Facebook views under 10 with no recent messages: suggest refreshing title keywords.

Flow: repositories regenerate pending recommendations whenever an item changes (price edit, listing change, stats logged) or on demand ("Recheck all listings", `POST /api/recommendations`). The feed (`/recommendations`) renders cards sorted by priority. Approval flow per card:

- Accept: recommendation marked accepted; a price-drop suggestion applies the new price locally and records price history. The card then offers copy-new-price, open-the-assisted-marketplace, and "I updated it manually" (marks done). The app never touches the marketplace itself.
- Dismiss: marked dismissed, collapsed into "Recently handled".

Connector boundary (`lib/connectors/`): one `MarketplaceConnector` interface for everything. eBay/Etsy stubs return ok:false "not configured" without credentials and never fake a live posting; Facebook, Craigslist, Mercari, Poshmark route through the assisted flow only (copy fields, open create/edit page, user posts, app tracks status). No scraping, no cookies, no login automation.

## Verification checklist

1. `npm run build` compiles with type checking.
2. `npx prisma validate` passes; `npx prisma migrate dev` applies `automation_engine_v1` (additive).
3. `npm run db:seed`: 4 items, 6 pending recommendations (exact demo strings), 4 automation rules.
4. `npm run smoke:persistence` passes and cleans up after itself.
5. Browser (mobile viewport): dashboard hero + next actions; recommendation cards render the six demo messages; health rings on cards; item page shows price history sparkline, manual stats form, activity timeline.
6. Log stats with messages > 0 on the DeWalt item: price-drop suggestion is replaced by "Hold price, recent messages suggest demand".
7. Accept the DeWalt price drop: item price becomes $115, price history gains an entry, helper buttons appear.
8. eBay/Etsy posting without env credentials reports "not configured" and saves a draft.
9. No browser console errors.
