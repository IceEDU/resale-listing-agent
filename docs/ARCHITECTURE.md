# Architecture

How the listing agent is wired as a web service, and where each responsibility runs. Serverless-ready: no long-lived processes, all background work happens inside request-scoped jobs triggered by cron.

```
Browser (PWA)                    Server (Next.js, Fluid Compute)         Scheduled
─────────────                    ───────────────────────────────         ─────────
Dashboard, listings feed   ──►   Route handlers /api/*                   Vercel Cron
Review + assisted screens        lib/store.ts facade                 ──► GET /api/cron/refresh
Recommendation cards             ├─ lib/repo/mock.ts   (no DB)               │
Manual stats forms               └─ lib/repo/prisma.ts (Postgres)            ▼
Copy buttons + deep links        lib/agent (mock AI, swappable)         lib/jobs/runner.ts
                                 lib/recommendations.ts (engine)        ├─ check-stale-listings
                                 lib/health.ts                          ├─ refresh-recommendations
                                 lib/audit/self-audit.ts                └─ self-audit
                                 lib/connectors (eBay/Etsy stubs,
                                   assisted-only for FB/CL/Mercari/Posh)
```

## What runs in the browser

- The PWA UI: dashboard, listings, review screen, recommendation feed, assisted posting/repost screens, manual stats forms.
- Clipboard copy actions and deep links that open a marketplace's own create/edit page in a new tab.
- Nothing sensitive: no credentials, no marketplace calls, no scraping. The browser only talks to this app's API routes.

## What runs on the server

- Next.js route handlers under `app/api/*`: items, listings, insights, metrics, recommendations, jobs, audit, health, cron.
- The repository layer (`lib/store.ts` facade): Prisma + Postgres when `DATABASE_URL` is set, in-memory mock otherwise. Same interface either way.
- The agent service (`lib/agent`, mock today, interface ready for a real model), the recommendation engine, health scoring, and the self-audit.
- Connector stubs for eBay/Etsy. They name the official APIs they would call and refuse to pretend success without credentials.

## What runs as scheduled jobs

`GET /api/cron/refresh` (Vercel Cron, or any external cron hitting the URL with the bearer secret) runs three jobs via `lib/jobs/runner.ts`, each logged as a `JobRun` row:

1. `check-stale-listings`: stamps `lastCheckedAt`, schedules `nextReviewAt` on assisted listings 14+ days old.
2. `refresh-recommendations`: re-runs the engine over every item with fingerprint dedupe.
3. `self-audit`: verifies the app's own data (see `docs/DESIGN_AUTOMATION_V1.md` and `/more/audit`).

Jobs read data and write recommendations and audit findings. They never post, reprice, repost, or delist on a marketplace.

## What stays manual, and why

Facebook Marketplace, Craigslist, Mercari, and Poshmark have no public listing APIs for individual sellers, and automating them through a logged-in browser session would violate their terms. So for those marketplaces the app only ever:

- prepares listing copy, prices, and checklists,
- opens the marketplace's own create/edit page,
- lets the user confirm what they did ("I posted it", "I reposted it"),
- tracks status and stats the user reports.

eBay and Etsy have official APIs; the connector interface is ready for them, but until credentials and the OAuth flow exist, the stubs return "not configured" and listings cannot be marked live through them.
