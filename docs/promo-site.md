# SparkyPass promotional website

The web app UI retired when SparkyPass moved to iPhone. This repo now serves two things from one Vercel project:

1. **The API the iPhone app depends on** — everything under `app/api/**`, `auth.ts`, `lib/**`, `data/questions/**`, the Drizzle schema, and the two crons in `vercel.json`. None of it changed in the site redesign except `lib/game-packs.ts`, whose game data moved from `app/(games)/*` to `lib/game-data/*`.
2. **The promotional site** — a static, SEO-first marketing site for the App Store listing.

## Pages

| Path | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Hero with a live practice question, five real App Store screenshots, free-test cards, Pro pricing, FAQ, JSON-LD (Organization, WebSite, MobileApplication). |
| `/free-journeyman-electrician-practice-test` | `app/free-journeyman-electrician-practice-test/page.tsx` | Hub: three test cards + exam guide. |
| `…/test-1` `…/test-2` `…/test-3` | `…/[slug]/page.tsx` | 20 questions each, fully server-rendered, interactive scoring + clock in `components/practice/PracticeTest.tsx`. |
| `/texas-journeyman-electrician-practice-test` | `app/texas-journeyman-electrician-practice-test/page.tsx` | TDLR/PSI facts verified 2026-10-27 (sources listed on the page). |
| `/privacy` `/terms` `/contact` `/dmca` | unchanged pages + new `layout.tsx` metadata | App Store Connect links to `/privacy` and `/contact`; the app opens `/privacy` and `/terms`. Keep these paths. |

Every retired URL (`/login`, `/quiz`, `/pricing`, `/load-calculator`, …) 308-redirects in `next.config.ts`. `/api/*` is deliberately excluded.

## Facts live in one place

`lib/site.ts` holds every number and claim the site makes (price, trial length, question count, iOS minimum, App Store id, legal lines). Change it there, not in page copy. `CONTENT_UPDATED` feeds the sitemap's `lastModified`.

## The 60 free questions

`data/practice-tests/manifest.json` lists which question-bank ids are in each test, plus **site-only** text overrides approved in review (paraphrased near-verbatim code text, fixed stale section lettering, 2026 Article 220 → 120 numbering). The app's bank in `data/questions/` is not modified.

Regenerate the snapshots after editing the manifest or the bank:

```
node scripts/build-practice-tests.mjs
```

The script whitelists fields (the bank is never shipped to browsers), shuffles options deterministically, and fails if an override's target text has drifted.

## Assets

- `public/screenshots/*.png` — the five live App Store screenshots at half resolution.
- `public/app-store-badge.svg` — Apple's official badge from the App Store Marketing Tools API. Keep ≥40px tall, one per layout, never recolor.
- `app/apple-icon.png`, `public/app-icon-*.png` — from the shipped iOS icon.
- `assets/fonts/*.ttf` — static Outfit/Space Mono used only by the Open Graph renderer (`lib/og.tsx`).

## Deploy

Same as before: `npx vercel --prod` from the checked-out branch. Build needs no env. Smoke-test `/privacy`, `/terms`, `/contact`, `/api/health`, and one `/api/auth/mobile/*` route after deploying.
