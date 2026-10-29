---
name: site-review
description: Weekly sparkypass.com review covering traffic, Google search, the quiz-to-App-Store funnel, paying subscribers and page speed, ending with at most 3 experiments for Luis to approve. Use Monday evenings, or whenever Luis asks how the website is doing.
---

# Weekly website review (W-14)

## Window

The last 7 days, compared with the 7 days before, plus the 28-day trend. Put the dates at the top.

## 1. Gather

Use whatever is available, and say plainly what's missing. Never fill a gap with a guess.

- **PostHog:** visitors, pageviews, top sources and pages, and the funnel events from the tracking plan (`docs/website/README.md`): `quiz_started`, `quiz_finished`, `app_store_tap` and `qr_shown`.
- **Google Search Console** (Luis's export): searches, pages, clicks, impressions, click-through rate and average position.
- **App Store Connect** (Luis's screenshot or export): installs by campaign (`ct=`).
- **Subscriber report** (Luis's Mac): paying subscribers and trials, and the change since last week.
- **Page speed:** run PageSpeed Insights (mobile) on the homepage and each quiz page. Record LCP, CLS and INP.

## 2. Scorecard

Show K-50 to K-55 with this week's value, last week's and the change. Put the funnel as counts and step-to-step rates: visitors → quiz started → quiz finished → App Store tap → installs.

## 3. Find what to fix

- The biggest drop-off in the funnel, and what on the page could cause it.
- Searches with many impressions but a low click-through rate: the title and description need work.
- Searches where we sit in positions 8 to 20: the page needs better content or internal links.
- Pages that got slower, or that miss the speed targets.
- Seasonality: Google Trends for the target searches, and upcoming exam dates or code-cycle news that change what people search.

## 4. Pick experiments

Pick at most 3, and only one change per page at a time. For each, give:

- the hypothesis, the change and the page
- the metric that decides it, and how long to run it (at least 2 weeks, unless traffic is high)
- what counts as a win, a loss or no result

Log them in `docs/website/experiments.md`.

## 5. Report

Write the review in the chat, in plain words, under 300 words: the scorecard, what changed and why, and the experiments for Luis to approve. If the SparkyPass HQ vault is available, also save it as `Briefs/Website/<date>.md`.

When Luis approves an experiment, build it with `seo-page` (or `teaser-quiz` for quiz changes) on its own branch, as a draft pull request.

## Rules

Counts and trends only: no visitor-level data, IP addresses or recordings in the report. Follow the agent's rules on claims and urgency (G-03, G-18).
