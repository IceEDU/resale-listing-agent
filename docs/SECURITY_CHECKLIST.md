# Security and secrets checklist

Run through this before every commit, and fully before making the repo public or deploying.

## Secrets and credentials

- [ ] `.env`, `.env.local`, and `.env.*.local` are gitignored (they are; verify with `git check-ignore .env`).
- [ ] `.env.example` contains placeholders only, never real values.
- [ ] No API keys, tokens, or passwords in source, docs, or test files. The only credentials that may appear in docs are the local Docker demo ones (`postgres:postgres@localhost`), which never leave the developer machine.
- [ ] `git log -p` for any file that ever contained a secret; if one leaked, rotate it and rewrite history before pushing.
- [ ] Quick scan before commit: `git grep -iE "(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}" -- ':!*.md'` returns nothing unexpected.

## Production configuration

- [ ] `CRON_SECRET` set in the hosting environment; `/api/cron/refresh` returns 401 without it in production.
- [ ] `DATABASE_URL` set through the host's env manager (e.g. `vercel env`), never committed.
- [ ] Future eBay/Etsy OAuth tokens are stored encrypted (schema field `MarketplaceConnection.encryptedAccessToken` exists for this) and requested with minimal scopes.

## Privacy promises (enforced in code, keep it that way)

- [ ] Photo analysis requires the explicit consent checkbox; `POST /api/items` rejects without it.
- [ ] EXIF/GPS stripping stays in the photo pipeline when real storage lands (roadmap phase 3).
- [ ] No scraping, no cookies, no login automation anywhere, including tests.
- [ ] Assisted marketplaces (Facebook, Craigslist, Mercari, Poshmark) are never posted to programmatically.
- [ ] Connectors never report a live listing without real credentials; the self-audit (`/more/audit`) flags violations.

## Repository hygiene

- [ ] LICENSE placeholder replaced with a real license before the repo goes public.
- [ ] CI green (`.github/workflows/ci.yml`) before merging to `main`.
- [ ] No push to any remote until the GitHub repository URL is provided and the repo is confirmed private.
