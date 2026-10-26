---
name: site-audit
description: Check sparkypass.com, or a preview build, for SEO, speed, accessibility and compliance problems. Run it before any website pull request is marked ready, and on the whole site on the 1st of each month.
---

# Website audit

Check each item, mark it pass or fail, and give the fix for every fail. Put the result in the pull request description, or in the chat for the monthly audit.

## Indexing

- `app/robots.ts` allows the public pages and still blocks the app and API routes.
- `app/sitemap.ts` lists only public pages, and every listed URL returns 200.
- Each page has a canonical URL, and nothing public is set to `noindex` by accident.
- Retired pages redirect with a 301 to the closest public page.

## Page basics

- A unique title of 60 characters or fewer, a description of 155 or fewer, and an Open Graph image.
- Exactly one H1.
- The main text is rendered on the server.

## Structured data

- Valid JSON-LD: run Google's Rich Results Test on the preview URL.
- True to the page: no invented ratings, reviews or prices.

## Speed (mobile, PageSpeed Insights or Lighthouse)

- LCP under 2.5 s, CLS under 0.1 and INP under 200 ms.
- Images use `next/image` at the right size.
- Videos are 1.5 MB or less, have a poster, load lazily below the fold, and are replaced by the poster when the visitor prefers reduced motion.

## Accessibility

- Alt text on meaningful images, readable contrast, keyboard access, visible focus and labeled controls.
- Run axe if it's available.

## Links and tracking

- No broken internal links.
- Every App Store link carries a campaign token (`ct=`), and every QR code opens the right link.
- The tracking-plan events fire in the preview. Check the PostHog live events.

## Compliance

- Claims match the claims register (G-03), with no fake urgency or invented discounts (G-18).
- Quiz questions are QA-approved and listed in `docs/website/quiz-approvals.md`.
- NEC references are in our own words and carry their edition (G-04).
- The footer has the trademark notice ("NEC® is a registered trademark of NFPA"), and nothing implies a tie to TDLR, PSI or NFPA.
- No web sign-up, checkout or link to `/register` or `/pricing` (D-52).
- The "fully updated for the 2026 NEC" claim appears only after the load-calc fixes are live.
- Nothing from Luis's day job (G-07).
