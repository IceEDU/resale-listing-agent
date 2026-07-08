# Agent Workflow v1 — specification and mock implementation

Status: implemented (mock AI) — 2026-07-06
Code entry points: `lib/agent/`, `app/new/`, `app/items/[id]/review/`, `app/items/[id]/assist/`

Turns the listing tracker into a listing agent: photos in → complete, reviewed, per-marketplace listing package out. The AI is a deterministic mock behind a service interface, so a real model swaps in without touching the app.

---

## 1. Flow diagram (description)

```
Photos (phone) ──► Consent gate ──► Quick questions (optional)
                                        │ condition? missing parts? paid? goal?
                                        ▼
                              Agent.generateListing(input)        [mock today]
                                        │
                                        ▼
                              REVIEW SCREEN (mandatory)
                     item · tags · price strategy · per-marketplace
                     copy + keywords · negotiation script
                          │                          │
                     Edit details              Approve → choose marketplaces
                                                        │
                    ┌───────────────────────────────────┴────────────┐
                    ▼                                                ▼
        Assisted (FB, CL, Mercari, Poshmark)              API (eBay, Etsy)
        copy buttons per field                            connector stubs only
        photo checklist                                   no OAuth yet
        open create-listing page                          status → ready
        user taps Post themselves
        "I posted it" → assisted_posted
                    │                                                │
                    └───────────────► STATUS TRACKING ◄──────────────┘
                       draft → ready → assisted_posted | active → sold | delisted
```

Key invariants (enforced in code, not just documented):

- Consent gate: `POST /api/items` rejects without `consent: true` (unchanged from v0).
- Review before posting: `/new` routes to `/items/[id]/review`; the post screen is only linked from there or the item page.
- No automated posting to assisted marketplaces: the app only prepares text and deep-links to the marketplace's own create page. No scraping, no form automation.
- No fake API integrations: eBay/Etsy stubs return `ok: false` + honest note when unconfigured; they never pretend a listing went live (stub success → `ready`, never `active`).

## 2. UI screens (textual mockups)

**S1 — New item (`/new`)**
Photo drop zone (camera capture, ≤8) → previews grid → optional hint field → "A few quick questions" card: condition segmented control (New / Open box / Used), missing-parts text (placeholder "None"), what-did-you-pay number, goal segmented control (Fast sale / Balanced / Max profit) — all skippable → consent checkbox → [Generate listing]. Footer: "Nothing gets posted without your review."
*Real-AI note: questions render only when the model reports low confidence for that field; mock shows all four (its `followUpQuestions` output lists what a real agent would still ask).*

**S2 — Review (`/items/[id]/review`)**
Header "Review your listing" + "Nothing posts until you approve it." Cards, in order: Item (title, category, condition, description, tag chips) · Price strategy (four tiles: max profit / realistic / fast sale / floor, goal-matched tile highlighted; recommended + min-take line) · one card per marketplace (Facebook, eBay, Craigslist): price, title, body, keyword chips · Negotiation script (numbered) · amber "answering these would sharpen the estimate" card when questions were skipped. Footer: [Edit details] [Looks good — post it].

**S3 — Marketplace picker (`/items/[id]/post`)** — unchanged from v0: checkbox per marketplace, honest mode blurbs.

**S4 — Assisted post (`/items/[id]/assist/[marketplace]`)**
Numbered steps: 1. Copy each field (Title / Price / Description rows, one copy button each, agent's marketplace-specific copy) · 2. Photo checklist (checkboxes from `photoChecklist`) · 3. Open the marketplace ↗ (deep link to official create page) · 4. [I posted it] → listing becomes `assisted_posted`.

**S5 — Item detail (`/items/[id]`)** — v0 form + insight panel, plus a banner linking back to the agent review when agent data exists.

## 3. Data schema — agent output

Canonical TypeScript in `lib/agent/types.ts`; stored as `Item.agentData` (JSONB) in Postgres, `item.agent` in mock mode.

```ts
AgentInput   = { hint?, photoCount, answers?: SellerAnswers }
SellerAnswers = { condition?: "new"|"open_box"|"used"; missingParts?; paidPrice?; goal? }

AgentListing = {
  version: 1; generatedAt: string;
  item: { title; category; brand; condition; description; tags[] };
  pricing: {
    strategy: { maxProfit; realistic; fastSale; floor };   // the four price points
    recommended;   // pre-picked from strategy by seller goal
    minTake;       // floor — surfaces in negotiation script
    goal;
  };
  copy: { [marketplace]: { title; body; keywords[]; recommendedPrice } };
  negotiationScript: string[];   // open, counter, lowball reply, close tactic, floor
  photoChecklist: string[];
  followUpQuestions: string[];   // what a real agent would still ask
}

interface AgentService { generateListing(input: AgentInput): Promise<AgentListing> }
```

Swap point: `lib/agent/index.ts#agent()` returns `mockAgent` today; return a real implementation (same interface) and nothing else changes.

Marketplace-specific generation (mock rules, real model replaces):
- Keywords — eBay: search terms + "tested working"; Facebook: local-pickup phrases; Craigslist: cash/local; Etsy: ≤13 tags; Mercari/Poshmark: shipping/bundle phrases.
- Prices — factor over recommended: FB/CL ×1.0 (no fees), eBay/Etsy ×1.08, Mercari ×1.10, Poshmark ×1.15 (fee offsets).
- Titles — eBay keyword-extended ≤80 chars; others human-plain.

## 4. Listing status model

`draft → ready → assisted_posted | active → sold | delisted → ready` (relist). Transition map enforced server-side (`LISTING_TRANSITIONS` in `lib/types.ts`; PATCH returns 409 on illegal moves). `assisted_posted` is distinct from `active` on purpose: the app can't verify an assisted listing is live, so it never claims more than "user says they posted it". Items show as active when any listing is `active` or `assisted_posted`.

## 5. API marketplace stubs

`lib/connectors/ebay.ts`, `lib/connectors/etsy.ts` — documented endpoints named in comments (eBay Sell Inventory API; Etsy Open API v3), no OAuth, no network calls. Unconfigured → `{ok: false, status: "draft"}` with setup note; env-configured → `{ok: true, status: "ready"}` (prepared, honestly never "live").

## 6. Sample mock output

Input: `{ hint: "KitchenAid stand mixer", photoCount: 4, answers: { condition: "used", missingParts: "none", paidPrice: 300, goal: "fast_sale" } }` (etsy/mercari/poshmark copy omitted for brevity — generated too):

```json
{
  "version": 1,
  "item": {
    "title": "KitchenAid stand mixer",
    "category": "Kitchen appliances",
    "brand": "KitchenAid",
    "condition": "good",
    "description": "KitchenAid Classic 4.5-quart stand mixer. Runs smoothly on all speeds, includes bowl and three attachments. Normal cosmetic wear.",
    "tags": ["kitchenaid", "stand", "mixer", "kitchen appliances"]
  },
  "pricing": {
    "strategy": { "maxProfit": 217, "realistic": 184, "fastSale": 151, "floor": 113 },
    "recommended": 151,
    "minTake": 113,
    "goal": "fast_sale"
  },
  "copy": {
    "facebook": {
      "title": "KitchenAid stand mixer",
      "body": "…\n\nCondition: Good\nPickup or local meetup — flexible on time.\nPriced to sell.",
      "keywords": ["kitchenaid", "stand", "mixer", "kitchen appliances", "local pickup", "porch pickup ok", "good"],
      "recommendedPrice": 151
    },
    "ebay": {
      "title": "KitchenAid stand mixer kitchen appliances",
      "body": "…\n\nCondition: Good\nShips within 1 business day, carefully packed.\nReturns accepted within 30 days.",
      "keywords": ["kitchenaid", "stand", "mixer", "kitchen appliances", "good", "fast shipping", "tested working"],
      "recommendedPrice": 163
    },
    "craigslist": {
      "title": "KitchenAid stand mixer",
      "body": "…\n\nCondition: Good\nCash, local pickup. Asking $151.\nText or email through the listing — no shipping, no checks.",
      "keywords": ["kitchenaid", "stand", "mixer", "kitchen appliances", "cash", "local", "good"],
      "recommendedPrice": 151
    }
  },
  "negotiationScript": [
    "Open at $151. 36 similar items sold for $151–$217 recently.",
    "If a buyer offers between $113 and $151, counter once at halfway, then accept.",
    "If a buyer offers below $113, reply: \"Thanks, but the lowest I can go is $124.\"",
    "To close fast: offer free local delivery or $146 for pickup today.",
    "Never accept less than $113 (you paid $300)."
  ],
  "photoChecklist": [
    "Cover shot: whole item, plain background, daylight",
    "Back / underside",
    "Brand label, model or serial number close-up",
    "Any flaws or wear, honest close-up",
    "In use or next to a common object for scale"
  ],
  "followUpQuestions": []
}
```

## 7. Implementation checklist

- [x] User photo upload flow (v0, unchanged; consent gate intact)
- [x] Conditional question prompts (all-optional card; `followUpQuestions` marks gaps)
- [x] Mock agent generates all required fields (title, category, condition, description, tags, FB/eBay/CL copy, per-marketplace prices, min take, negotiation script)
- [x] Review screen before posting (mandatory route in the flow)
- [x] Assisted UI: per-field copy buttons, photo checklist, open-marketplace link, mark-as-posted
- [x] API marketplace stubs without OAuth (eBay, Etsy)
- [x] Listing statuses + transition enforcement (draft/ready/assisted_posted/active/sold/delisted, 409 on illegal)
- [x] Price strategy (max profit / realistic / fast sale / floor, goal-driven recommendation)
- [x] Marketplace-specific keyword generation
- [x] Constraints enforced: no FB scraping, no automated FB posting, no fake integrations, user-reviewed everything, consent gate kept
