# Deployment (Vercel or any Node host)

The app is a standard Next.js App Router project: serverless-friendly, no long-lived processes, background work via cron-triggered API routes.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes for persistence | Postgres connection string (Neon/Supabase/RDS/etc). Without it the app runs in in-memory mock mode, which resets on every cold start; fine for demos, wrong for production. |
| `DIRECT_URL` | Only with pooled DBs | Non-pooled connection for `prisma migrate` when `DATABASE_URL` goes through a pooler. Add `directUrl = env("DIRECT_URL")` to the datasource block when you enable this. |
| `CRON_SECRET` | Recommended | Protects `/api/cron/refresh`. Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when the project has the variable set. Without it, the cron route refuses to run in production. |
| `AI_GATEWAY_API_KEY` | Later | Placeholder for the real AI service that replaces the mock agent. |
| `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` / `EBAY_RU_NAME` | Later | Official eBay Sell API credentials. |
| `ETSY_KEYSTRING` / `ETSY_SHARED_SECRET` | Later | Official Etsy Open API v3 credentials. |

## Vercel steps

1. Push the repo to GitHub and import it in Vercel (framework auto-detected).
2. Provision Postgres (e.g. Neon via the Vercel Marketplace) and set `DATABASE_URL` (+ `DIRECT_URL` if pooled).
3. Set `CRON_SECRET` to a long random string.
4. Run migrations against the production database from your machine or CI: `npx prisma migrate deploy`, then optionally `npm run db:seed` for demo data.
5. Deploy. `vercel.json` already schedules the cron.

## Cron

`vercel.json` runs `/api/cron/refresh` twice a day (13:00 and 01:00 UTC, roughly morning and evening for US time zones):

```json
{ "crons": [
  { "path": "/api/cron/refresh", "schedule": "0 13 * * *" },
  { "path": "/api/cron/refresh", "schedule": "0 1 * * *" }
] }
```

Each run executes check-stale-listings, refresh-recommendations, and self-audit, and logs a `JobRun` row per job. These jobs generate recommendations and audit findings only. They never perform marketplace actions; posting, repricing, and reposting always require the user to accept a suggestion and do the marketplace step themselves.

Any external cron works too: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/refresh`.

## Monitoring

- `GET /api/health`: app status, database reachability, storage mode, last job run, version.
- `/more/automation`: job history and manual triggers.
- `/more/audit`: open self-check findings.
