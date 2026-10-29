# sparkypass.com: the promotional site

The brief for the Website Lead agent (`.claude/agents/website.md`). Its first job is the redesign below.

## Decisions (Luis, Oct 26, 2026)

- **D-51** sparkypass.com becomes a promotional site for the iPhone app. The web app is retiring, as the Aug 29 commits already started.
- **D-52** There is no web sign-up. Every call to action goes to the App Store.
- **D-53** The site sells paid subscriptions from launch. This replaces D-44 for the website. The load-calc gate on claims stays: no "fully updated for the 2026 NEC" until those fixes are live in the app.
- **D-54** A Website Lead agent (A-16) runs the site: SEO, analytics and conversion experiments. It works on branches; Luis merges.
- **D-55** The redesign has three teaser quizzes and short animations of the app's screens.

## Goal

Visitors → App Store installs → paying subscribers.

## Audience

Texas electricians studying for the Journeyman and Master exams. Most will visit on a phone, and many use Android. The app is iPhone-only for now, and the site says so plainly.

## Homepage, top to bottom

1. **Hero**
   - The headline, a one-line subhead and the App Store badge (`ct=home-hero`), plus a QR code on desktop.
   - A phone outline playing the quiz demo.
   - Draft headlines, for Luis to approve:
     - "Study for the Texas electrician exam on your phone."
     - "Texas Journeyman and Master exam prep, one question at a time."
2. **Try a quiz:** three cards, one per teaser quiz. Each is 5 questions and about 2 minutes.
3. **Inside the app:** 3 or 4 short demo loops with a one-line caption each:
   - a quiz question with its explanation
   - a timed mock exam
   - a daily challenge and streak
   - formula flashcards

   Leave the load-calculation tool out until the load-calc fixes ship.
4. **What you get:** 500+ practice questions, formula flashcards, timed mock exams, progress tracking and daily challenges.
5. **Price:** the App Store paywall's current offer, which today is a 7-day free trial, then $14.99 a month (one plan; the $0.99 first month was dropped in Sept 2026). Cancel anytime in Apple ID settings. Check it in the app before launch.
6. **FAQ:**
   - About the exam (PSI, open book, the passing score, English and Spanish), each with a dated link to TDLR or PSI. Re-check every fact at build time.
   - Is there an Android app? Not yet.
   - Which NEC edition? Texas exams follow the 2026 NEC from Sept 1, 2026. Say honestly where the app stands.
   - How do I cancel?
7. **Final call to action and footer:** privacy, terms, contact, "SparkyPass LLC", and the notice "NEC® is a registered trademark of NFPA."

## The three quizzes

See the `teaser-quiz` skill. The proposed quizzes are Journeyman practice, Master practice and 2026 NEC changes, with 5 QA-approved questions each and no load calcs for now.

## Animations

- **Clips:** the four listed under "Inside the app," 6 to 10 seconds each.
- **Recording:** either way works.
  - Luis records on his iPhone with Control Center → Screen Recording. Use a demo account with no personal details, with notifications silenced.
  - Or the agent records the iOS Simulator on the Mac (`xcrun simctl io booted recordVideo`), after setting a clean status bar (`xcrun simctl status_bar booted override --time 9:41 --batteryLevel 100`).
- **Processing:** trim and crop to the screen, then encode H.264 MP4 at 30 fps with no audio, 1.5 MB or less. Make a poster JPG from the first frame.
- **Playback:**
  - Use `<video muted loop playsinline preload="none" poster=…>`, started when the clip scrolls into view.
  - Use framer-motion (already installed) only for light reveal effects.
  - Show only the poster when the visitor prefers reduced motion.

## Tracking plan

**Tool:** PostHog's free tier, through `posthog-js`, set up in `instrumentation-client.ts`. Session recording stays off.

| Event | When | Properties |
|---|---|---|
| `$pageview` | automatic | path, referrer, UTM tags |
| `quiz_started` | the first answer in a quiz | `quiz` |
| `quiz_answered` | each answer | `quiz`, `question_id`, `correct` |
| `quiz_finished` | the score screen | `quiz`, `score` |
| `app_store_tap` | any App Store badge or link | `placement`, `ct` |
| `qr_shown` | a QR code shown on desktop | `placement` |
| `demo_played` | a demo clip starts | `clip` |

**App Store campaign links:** `https://apps.apple.com/app/apple-store/id6801112841?pt=<provider token>&ct=<placement>&mt=8`. The `ct` values are `home-hero`, `home-footer`, `quiz-journeyman`, `quiz-master`, `quiz-2026` and `guide-<slug>`.

**Smart App Banner:** Next.js metadata `itunes: { appId: "6801112841" }` on the public pages, so iPhone visitors in Safari see "Get" at the top.

**Privacy page:** add PostHog and what it collects. Luis approves the wording.

## Starting searches (validate before building)

- texas master electrician exam practice test
- texas journeyman electrician practice test
- texas electrician exam prep
- 2026 NEC changes
- electrician exam prep app

As of Oct 24, 2026, sparkypass.com didn't show up in Google even for its own name, so Search Console comes first.

## Launch checklist

- [ ] **Luis:**
  - Create a PostHog project, connect the PostHog connector in Claude, and add the public project key to Vercel as `NEXT_PUBLIC_POSTHOG_KEY`.
  - Verify sparkypass.com in Google Search Console and submit `https://sparkypass.com/sitemap.xml`.
  - Get the provider token from App Store Connect's campaign link generator.
  - Record the demo clips, or approve Simulator recordings.
  - Approve a headline.
- [ ] **Agent:** build the homepage, the three quiz pages, tracking and the Smart App Banner on `website/redesign`, as a draft pull request with a preview.
- [ ] **QA (HP1):** claims, quiz answers and citations, accessibility and speed.
- [ ] **Luis (HP2):** check the preview on his phone and merge.
- [ ] **The Monday after launch:** the first weekly review.

## Retiring the web app (separate; starts when Luis says go)

1. Count the legacy web subscribers with the subscriber report: Stripe subscriptions, lifetime purchases, and anyone without an iPhone.
2. Decide what each group gets. The iPhone app honors web subscriptions today, but Android users and lifetime buyers need a plan, such as a notice, a refund or another option.
3. Email a notice before any page goes away.
4. Keep everything under `app/api/`: the iPhone app depends on it.
5. 301-redirect the retired pages (`/register`, `/login`, `/pricing`, `/dashboard` and the study pages) to the homepage or the closest quiz page.
6. Remove the Stripe checkout pages, but keep the Stripe webhook until the last web subscription ends.
7. Update the privacy policy and terms.
