## Summary

<!-- What does this PR do, in one or two sentences? -->

## Changes

-

## Verification

- [ ] `npm run build` passes
- [ ] `npx prisma validate` passes
- [ ] `npm run smoke:persistence` passes (Prisma mode)
- [ ] `npm run smoke:automation` passes (Prisma mode)
- [ ] Mock mode still works with `DATABASE_URL` unset
- [ ] Checked in the browser (mobile viewport) where UI changed

## Safety checklist

- [ ] No secrets, tokens, or real credentials added
- [ ] No scraping, cookies, or login automation introduced
- [ ] Facebook/Craigslist/Mercari/Poshmark remain assisted-only
- [ ] Connectors never fake a live marketplace posting
- [ ] Consent gate for photo analysis untouched or improved
