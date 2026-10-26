---
name: seo-page
description: Research, write and build one page on sparkypass.com for a target Google search, either new or improved, with on-page SEO, structured data and the App Store call to action, as a draft pull request. Use when Luis or the weekly review asks for a new page or a better one.
---

# Build or improve a page for search

## 1. Choose the search

- One main search, plus 2 to 4 related ones. Lean Texas-specific: the Texas journeyman and master exams, PSI, TDLR licensing steps and 2026 NEC changes.
- Check demand: Search Console queries (if Luis shared an export), Google Trends, and Google's autocomplete via web search.
- Read the top 5 results. Note what they cover, their format and their length, and what's missing that we can do better (a short quiz, a clear answer, a Texas angle).

## 2. Brief

Before you write, put the brief in the pull request description:

- what the searcher wants to know or do
- the questions the page must answer
- the outline
- the call to action
- the internal links in and out

## 3. Write

- Plain words for working electricians, short paragraphs, and the answer first.
- Facts with a source. Exam facts come from TDLR or PSI pages, linked and dated.
- Cite the NEC by section and edition in your own words. Never reproduce NFPA text (G-04), and never use real exam questions (G-05).
- Claims only from the claims register (G-03). No fake urgency (G-18).
- The `marketing-psychology` skill can help with persuasion, within G-20: real benefits only, nothing manipulative.

## 4. Build (Next.js App Router)

- Metadata: a unique title of 60 characters or fewer, a description of 155 or fewer, the canonical URL and an Open Graph image.
- One H1, sensible H2 and H3 headings, and the main text rendered on the server so Google can read it.
- Structured data in JSON-LD, true to the page. Use `FAQPage` only for a real FAQ. For the app, use `MobileApplication` with its price; never add ratings that aren't real.
- Add the page to `app/sitemap.ts`, and link to it from at least one existing page.
- Call to action: the App Store badge with a campaign link (`ct=` set to the page name). On desktop, show a QR code to the same link.
- Images and videos: correct sizes, lazy-loaded below the fold, with a poster for every video.

## 5. Check and hand off

1. Run the `site-audit` checks on the preview.
2. Open a draft pull request with the brief, the target search, the metric to watch and the audit results.
3. Ask for QA (HP1), then Luis (HP2).
