# QA pass 1: empty, loading, and error states

Date: 2026-07-08 · Method: dogfooding in a 375x812 mobile viewport (Prisma mode, seeded data), plus forced-failure simulation by stubbing `fetch` to return HTTP 500 on mutations. Scope per BUILD_ROADMAP.md phase 2; no features added.

## Findings

| # | Area | Finding | Severity | Status |
|---|---|---|---|---|
| 1 | Item form | PATCH failure still shows "Saved ✓": the save handler never checked `res.ok`, so a 500 looked identical to success. Silent data loss. | High | Fixed |
| 2 | Mutation buttons | Accept/Dismiss on recommendation cards, manual stats logging, insight refresh, and the post-to-marketplaces action all failed silently: no message, button just returned to idle. | High | Fixed |
| 3 | Listings empty state | With a filter active (e.g. Sold and zero sold items) the page showed "Nothing here yet. Snap your first item" even with a full inventory: misleading first-run copy in a filtered view. | Medium | Fixed |
| 4 | Dashboard empty state | Correct: with zero items shows the snap-your-first-item card; with zero pending suggestions shows "Nothing urgent". Verified by code review. | OK | No change |
| 5 | Recommendations empty state | Correct: "All caught up" card plus recheck button. | OK | No change |
| 6 | Bad item ID | Correct since PR #1: branded 404 with recovery links at `/items/does-not-exist` and unknown marketplaces in assist routes. | OK | No change |
| 7 | Delete/archive item flow | Does not exist yet. No way to remove an item from the UI (only direct DB access). Roadmap phase 2 backlog item; deliberately not built in this loop to keep the change small. | Gap | Deferred |
| 8 | Loading states | Buttons show busy labels ("Saving…", "Posting…", "Running…") consistently. Full-page loads are server-rendered and fast; no skeletons needed yet. | OK | No change |

## Fixes applied in this pass (top 3 by impact)

1. Item form now checks the response and shows "Couldn't save, try again." on failure; "Saved ✓" only on true success.
2. All mutation buttons surface failures: recommendation Accept/Dismiss/Done, manual stats logging, insight refresh, and marketplace posting show an inline error message instead of failing silently.
3. Listings empty state is filter-aware: filtered views say "No [filter] listings." with a link back to all listings; the snap-your-first-item CTA only appears when the inventory is truly empty.

## Remaining observations (not fixed here)

- Delete/archive item flow missing (finding 7): next-highest QA item, needs a confirmation step and cascade rules, so it deserves its own loop.
- Offline/network-down behavior: mutations now show an error, but there is no retry queue; acceptable for now.
- `window.confirm`-style guard before dismissing a recommendation might prevent accidental taps; low priority.
- Accessibility pass (focus order, screen-reader labels on icon-only nav) still pending from the phase 2 list.
