# SparkyPass Mobile Conversion — Planning Doc

**Status:** Pre-decision research. Nothing committed. Goal of this doc is to surface options and pin down decisions before any code is written.

**Last updated:** 2026-05-13

---

## 1. Goal

Take the existing SparkyPass Next.js web app and ship it as a mobile application via Xcode (App Store iOS). Scope of "ship" and how literal "via Xcode" is — TBD; see Section 4.

Note: "via Xcode" is the user's framing, but Xcode is the build environment, not the architecture. The real architectural choice is the **frontend stack** (native Swift vs React Native vs webview wrapper vs PWA), all of which can ultimately produce an `.ipa` through Xcode.

## 1.5 Decisions summary (as of 2026-05-19)

All planning questions answered. Full reasoning in Section 4. Build phase blocked only on Section 7 pre-build tasks.

| Dimension | Decision |
|---|---|
| **Stack** | React Native + Expo + TypeScript (converges with [[SparkyPass Showdown]]) |
| **Platform** | iOS-first, Android possibly someday |
| **Long-term role** | Mobile eventually replaces web |
| **v1 scope** | Core + retention loop: quiz, daily challenge, SRS+Circuit Breaker, Watts/Voltage/Amps, Sparky, bookmarks, flashcards, Streak Fuse, referrals, Power Grid viz |
| **Deferred past v1** | 4 minigames, mock exam, load calculator, friends/leaderboard, full power-ups shop, admin |
| **Offline** | Full offline-first (local SQLite, append-only Watts ledger, server reconciliation on sync) |
| **Question bank** | Hybrid — Apprentice/Journeyman bundled, Master fetched |
| **Launch bar** | TestFlight beta 3–6 months → public launch |
| **Monetization** | **Apple IAP from day one** via RevenueCat. SBP rate 15%. iOS price matches web at $14.99/mo. No migration of existing Stripe subscribers. Power-ups Watts-only. |
| **Sign-in** | Apple + Google + Email at equal weight. SiwA mandatory under Guideline 4.8. |
| **Account linking** | Auto-link by email with explicit user confirmation. |
| **Account deletion** | 30-day soft-delete grace period (per Guideline 5.1.1(v)). |
| **Sessions** | 90-day sliding refresh token in Keychain. No biometric prompts v1. |
| **Backend** | Stays on Vercel + Turso + Drizzle for v1. Turso → Postgres flagged as future task. |
| **Real-time** | None in v1. |
| **Crash reporting** | `@sentry/react-native`, same Sentry org as web. |
| **Push v1** | Daily streak reminder + weekly digest. |
| **Min iOS** | iOS 15+. |
| **Team** | Solo, with AI assistance. |
| **Timeline** | Open-ended (~4–6 months to TestFlight). |
| **Next deliverable** | API contract audit (see Section 7). |

---

## 2. What we're working with (current architecture snapshot)

| Area | Count / Detail |
|---|---|
| Total LOC (app + components + lib) | ~54,600 |
| Page routes (`app/`) | ~85 |
| API routes (`app/api/`) | ~60+ |
| React components | 88 |
| DB tables (Drizzle + Turso SQLite) | 18 |
| Question bank | 9 JSON files in `data/questions/`, ~2,000+ questions |
| Auth | NextAuth v5 (Google OAuth + email/password), JWT sessions |
| Payments | Stripe (checkout, customer portal, webhooks) |
| Animation deps | Framer Motion, canvas-confetti |
| UI deps | shadcn/ui, Tailwind v4, lucide-react |
| Real-time | None — polling via API calls |
| Static export? | **No.** `next.config.ts` has no `output: 'export'`. App requires a Node server. |
| Existing PWA / native shell? | **None.** No manifest.json, no Capacitor/Expo/Tauri config. |
| Web-only APIs in use | localStorage (quiz state), window.dispatchEvent (`watts-updated`), MutationObserver (theme), window.scrollTo |

**Heavy feature areas (each one is its own conversion sub-project):**
- Quiz engine + per-category state
- Spaced repetition system (SM-2 algorithm, `questionSrs` table)
- Circuit breaker (cooldown logic)
- Watts economy + transactions ledger
- Power-ups (purchases, activation, expiry)
- Power Grid visualization
- 4 minigames (Index Sniper, Translation Engine, Formula Builder, Index Game)
- Load Calculator (residential + commercial)
- Mock exam engine (full proctored experience)
- Bookmarks + Flashcards
- Friends / Leaderboard / Referrals
- Onboarding tour (react-joyride)
- Subscription/trial paywall
- Sparky mascot system (17 SVG expressions, contextual tips)

**Existing adjacent plan:** [SparkyPass Showdown](../../README.md) — separately planned standalone mobile quiz game using **React Native + Expo + Supabase**. Different stack. Worth deciding if this conversion converges with it or stays separate (see Q3 below).

---

## 3. Conversion strategy options

Five practical paths. The backend (Node API + Turso DB + Stripe webhooks) stays running in all of them — the question is what runs on the device.

### Option A — Full native Swift (SwiftUI)
**What it is:** Rewrite the frontend in SwiftUI. Backend API stays as-is, called via URLSession. Local data layer in SwiftData or Core Data. Replace NextAuth on-device with Sign in with Apple + Google Sign-In; backend issues JWTs.

- **Pros:** Best-in-class iOS feel. SF Symbols, native gestures, native scroll, native dark mode, push notifications easy, Sign in with Apple free. Best App Store reception. Future widgets / watchOS / shortcuts open up.
- **Cons:** Largest rewrite (12–16 weeks per the survey). Two codebases to maintain forever (web + iOS). Animations (Framer Motion, confetti) need bespoke recreation. iOS-only — Android needs a third rewrite.
- **Stripe wrinkle:** Apple requires IAP for digital subscriptions. ~30% cut. Stripe stays for web-only signups.

### Option B — React Native + Expo (converge with Showdown plan or alone)
**What it is:** Rewrite the frontend in React Native. Reuse business logic (Watts math, SRS algorithm, calculator formulas) as plain TypeScript. Backend stays.

- **Pros:** ~50% rewrite vs A — TypeScript carries over, mental model carries over. Cross-platform Android nearly free later. Shares stack with planned Showdown app — single mobile team. Expo handles updates, push, deep links.
- **Cons:** Still a rewrite of all 88 components + screens. Some native polish loss vs Swift. Larger app binary. Same Apple IAP issue as A.

### Option C — Capacitor (webview wrapper, native shell)
**What it is:** Wrap the existing Next.js app (running on your server) in a Capacitor iOS shell. Ships as a real `.ipa` via Xcode. Native plugins for camera/notifications/IAP available.

- **Pros:** Fastest path — weeks not months. Reuse ~100% of frontend code. One codebase. Updates ship without App Store review (web content updates live).
- **Cons:** It's a webview. Scroll feel, gestures, keyboard handling are noticeably "web." Apple has historically rejected pure webview apps unless there's clear native value-add. Offline support is fragile (Next.js SSR pages don't work offline by default). Animations OK but not 60fps native.
- **Open question:** Would need to either (1) keep the app online-only, or (2) carve out a subset of pages that work as a static bundle + API client.

### Option D — PWA / Add to Home Screen
**What it is:** Add `manifest.json`, service worker, install prompt. No App Store presence.

- **Pros:** Days of work. No App Store fees, no Apple IAP cut.
- **Cons:** No App Store discoverability. iOS PWA support is worse than Android (no push notifications until iOS 16.4+, limited storage, no IAP). User said "via Xcode," so this likely doesn't satisfy the goal — but worth listing as a free intermediate step.

### Option E — Hybrid: native shell + webview islands
**What it is:** Native Swift shell handles auth, navigation, payments, and a few hero screens (Dashboard, Quiz). Less-critical screens (Power Grid, Bookmarks, legal pages) load as webviews from the existing site.

- **Pros:** Native feel where it matters, fast time-to-market for the long tail. Lets us migrate screen-by-screen instead of big-bang.
- **Cons:** Complex routing and auth bridging (sharing session between native and webview). Inconsistent UX between native and web screens. Harder to maintain.

### Rough comparison

| | A: Native Swift | B: React Native | C: Capacitor | D: PWA | E: Hybrid |
|---|---|---|---|---|---|
| Time to v1 | 12–16 wk | 8–12 wk | 2–4 wk | <1 wk | 6–10 wk |
| Native feel | ★★★★★ | ★★★★ | ★★ | ★★ | ★★★★ |
| Code reuse from web | 0% | ~30% (logic) | ~95% | 100% | ~50% |
| App Store fit | ★★★★★ | ★★★★★ | ★★★ | ✗ | ★★★★ |
| Android later | Rewrite | ~Free | Free | Free | Rewrite shell |
| Offline support | Best | Good | Hard | Hard | Mixed |
| Apple IAP friction | High | High | High | N/A | High |

---

## 4. Decision questions

Answer these before picking an option. Roughly grouped by what they unblock.

### A. Strategic / Product ✅ ANSWERED 2026-05-13

1. **Why mobile, and why now?** → **All four drivers apply:**
   - App Store presence / credibility
   - Push notifications & retention (daily-streak reminders)
   - Offline study (commuting electricians, no-signal job sites)
   - iOS-specific features (Sign in with Apple, widgets, watch, IAP)

   _Implication:_ This is a real native-feeling app, not a webview wrapper. Capacitor and PWA are off the table.

2. **Is the mobile app meant to replace the web app, or coexist?** → **Mobile eventually replaces web.**

   _Implication:_ Long-term scope is full feature parity (incl. calculators, admin, mock exam). v1 can be a subset, but the architecture must not foreclose getting there. Web becomes a marketing/SEO surface over time.

3. **How does this relate to SparkyPass Showdown?** → **Converge stacks — both on React Native + Expo.**

   _Implication:_ Stack is locked to React Native + Expo. One mobile team, shared Sparky avatar, shared Watts UI, shared audio/ElevenLabs pipeline. The [[SparkyPass Showdown]] memory should be updated to reflect that it's part of a unified mobile codebase, not a separate stack.

4. **iOS only forever, or iOS-first with Android later?** → **iOS-first, Android possibly someday.**

   _Implication:_ Don't pay a big cost upfront for Android, but RN gives it nearly free if/when we want it. Reinforces the RN choice.

5. **Bar for v1 launch?** → **TestFlight beta for 3–6 months, then public launch.**

   _Implication:_ Pairs well with Expo EAS over-the-air updates — we can ship daily during beta without App Store review. Existing SparkyPass subscribers + a waitlist become the beta cohort. Rough edges are tolerated; learning velocity prioritized.

#### ⚠️ Tension noted

Q1 drivers (Sign in with Apple, widgets, watch, IAP) span the RN-friendly to RN-hostile spectrum:
- **Sign in with Apple** → easy in RN/Expo (`expo-apple-authentication`)
- **IAP** → easy in RN (`react-native-iap` or `expo-in-app-purchases`)
- **Push notifications** → easy in RN (`expo-notifications`)
- **Widgets** → requires WidgetKit/Swift glue alongside the RN app — doable but adds a small native iOS sub-project
- **Apple Watch** → weak in RN — would need a separate Swift watchOS target

Decision: accept this. Widgets and watchOS are post-v1. RN handles 95% of v1; we add Swift surface area only when we need it.

#### Stack decision (locked from Section A answers)

**Stack: React Native + Expo + TypeScript.** Backend stays on Vercel + Turso. Native iOS additions (widgets, watch) deferred. This makes Section 6's tentative recommendation — Option B — the actual choice.

### B. Scope of the v1 ✅ ANSWERED 2026-05-13

6. **v1 feature cut?** → **Recommended v1 — core + retention loop.**

   **In v1:**
   - Auth: Sign in with Apple, Google, email
   - Quiz engine (one category at a time)
   - Daily Challenge
   - Watts: earn + display + transaction list
   - Sparky mascot (full expression set)
   - Settings (account basics)
   - Push notifications (streak reminders)
   - Subscription paywall (Apple IAP)
   - Bookmarks
   - Spaced repetition: Daily + Weak Spots review
   - Circuit Breaker (tied to SRS)
   - Flashcards (with bookmarks)
   - Streak tracking + Voltage tier display + Amps gauge
   - Power-ups: Streak Fuse only
   - Referrals
   - Power Grid visualization

   **Deferred past v1:** All 4 minigames (Index Sniper, Translation Engine, Formula Builder, Index Game), Mock exam, Load Calculator (stays web), Friends/Leaderboard, full power-ups shop, admin tools.

   _Implication:_ Target ~4–6 month build to TestFlight beta. Existing web features stay live to cover deferred functionality during the parallel-running period (per Section A Q2: web eventually retires once mobile reaches parity).

7. **Offline scope?** → **Full offline-first.**

   User can take quizzes, earn Watts, update SRS state, and view bookmarks with no network. App syncs to backend on reconnect.

   _Implication:_ Local SQLite (likely WatermelonDB or op-sqlite + Drizzle-on-RN) for on-device state. Watts ledger must be append-only on device so server can reconcile without losing transactions. SRS algorithm runs locally, server is the durable record. Conflict policy needed (recommend: server-wins for read-models like Voltage tier; client-wins for in-flight quiz attempts). Adds ~2–3 weeks of infra work.

8. **Question bank distribution?** → **Hybrid — bundle a starter set, fetch the rest.**

   v1 .ipa bundles Apprentice + Journeyman questions (covers offline-study driver out of the box). Master-tier and any post-launch new content fetched on demand and cached locally.

   _Implication:_ Build a question-pack API (probably `/api/question-packs/[tier]` with ETag/version headers) — doesn't exist yet on the backend. Decide content cadence: how often does the question bank change, and do those updates require an App Store release for the bundled tier? Recommend: bundled questions can also be hot-updated via Expo OTA for typo fixes, with App Store releases reserved for net-new packs.

### C. Monetization ✅ ANSWERED 2026-05-18

**Decided on Option C — Apple IAP from day one** after two rounds of research (Apple policy + empirical developer data). Key findings that drove the decision:

- SparkyPass is **not a Reader app** under Guideline 3.1.3(a) — the list is exhaustive (magazines, newspapers, books, audio, music, video). Pure Netflix model is non-compliant at public launch.
- RevenueCat × Dipsea A/B test (May 2025, ~3,100 users/variant): IAP-only nets **$2.53/user vs web-only's $1.96** at the 15% SBP rate. IAP completion 71% vs web 44%.
- Adapty's independent 16,000-app dataset: IAP LTV $40.10 vs web LTV $35.80 — **web loses $4/sub even after fee savings**, driven by worse month-6+ retention.
- Education category specifically: **23.5% of users start trials >30 days after install** (slowest-deciding vertical). Frictionless saved-payment IAP signup is the single biggest lever for this audience pattern.
- All direct competitors (Duolingo, Quizlet, Brilliant, Pocket Prep) use IAP. Mike Holt has no real mobile presence — gap to exploit.

#### Specific decisions

9. **iOS subscription path:** **Apple IAP from day one** (Option C). RevenueCat + `react-native-purchases` (Expo-compatible). Apple Small Business Program rate of 15% applies (revenue <$1M/yr). Re-qualify annually.

10. **Existing Stripe web subscribers:** **Honor entitlement on mobile, no migration.** Unified entitlement record on backend (single source of truth on user record), updated by either Stripe webhook or Apple Server-to-Server Notifications. RevenueCat's `customerInfo.entitlements` model handles this natively.

11. **Power-ups:** **Watts-only, never real-money.** No consumable IAPs for power-ups in v1 or planned. Watts is a closed in-app economy.

12. **IAP timing in TestFlight:** **IAP integrated from TestFlight day one, beta testers bypass via promo codes.** Paywall UX gets real validation during beta; testers don't have to enter sandbox payment. Slight test-ops overhead (managing promo code distribution) is worth the paywall-friction data.

13. **iOS pricing:** **$14.99/mo, matching web.** Same price across platforms — strongest cross-platform user trust signal, no "screw mobile users" optics. Margin trade-off: ~$2/mo less per iOS sub vs web ($12.74 net IAP vs $14.55 net Stripe). At SBP rate (15%), this gap is much smaller than the 30% scenario where the standard "iOS +50%" advice was calibrated. **Revisit pricing if/when we cross $1M ARR and lose SBP eligibility** — at 30% the math changes materially.

14. **Future optionality:** If post-Epic External Purchase Link rules settle favorably for US storefront, we can later add an "or subscribe on sparkypass.com" link inside iOS to reclaim some of Apple's cut on price-sensitive segments. RevenueCat supports this path. Not v1 work.

#### Engineering scope (RevenueCat + Expo)

- ~7–11 days total: RevenueCat setup, Expo dev build, paywall UI, restore-purchase, sandbox testing, backend webhook integration, cross-platform entitlement reconciliation.
- Backend new surface: `/api/webhooks/apple` (S2S notifications) and unified `subscription_status` field semantics that accept both Stripe and Apple sources.

### D. Auth & accounts ✅ ANSWERED 2026-05-19

15. **Sign-in providers:** Sign in with Apple, Google, Email — **equal weight, side-by-side**. SiwA is mandatory under Apple Guideline 4.8 (required when any third-party social sign-in is offered). All three rendered at equal visual prominence.

16. **Cross-provider account linking:** **Auto-link by email**, single account with multiple linked providers.

    _Implementation note:_ This is the right product call but has one known wrinkle — SiwA users can use Apple's "Hide My Email" relay address, which won't match any existing Google/email account record. Recommended flow:
    - On SiwA signup, if the relay-address user has no matching account, create a new one but show a "Have an account on web? Link it" prompt offering to verify by sending a code to the user's real email.
    - On Google/Email signup, if the email matches an existing SiwA-linked account, prompt user to confirm linking with a one-time-code email.
    - Never auto-merge accounts silently — always require explicit user confirmation to avoid accidental data merges across separate people sharing an email.

17. **Account deletion:** **30-day grace period.** Required by Apple Guideline 5.1.1(v) for any app offering in-app signup. Implementation:
    - "Delete account" in Settings marks user as `deleted_at: <date>`, locks login, hides from leaderboards/friends.
    - Background job hard-deletes 30 days later (purges user record, progress, Watts ledger, bookmarks, SRS state, subscription record on backend; cancels active Apple/Stripe subscription).
    - If user signs in within 30 days, account auto-restores.
    - Requires new DB column (`users.deleted_at`) and migration. Soft-delete-aware queries throughout (`WHERE deleted_at IS NULL`).

18. **Session/token strategy:** **Long-lived refresh token, no biometric prompts.**
    - Refresh token stored in iOS Keychain (Secure Enclave-backed where available).
    - Access token rotates every ~1 hour via refresh endpoint.
    - Refresh token TTL: 90 days from last use, sliding window.
    - No Face ID/Touch ID required for sensitive actions in v1. Acceptable risk for an exam-prep app (low PII, no financial actions besides subscription management which Apple already gates behind the Apple ID password).
    - _Possible future tightening:_ if user reports show issues with stolen-phone account access, add optional biometric lock as a Setting (off by default). Not v1.

19. **Backend additions required:**
    - `POST /api/auth/mobile/apple` — verify SiwA identity token, mint or find user, return access + refresh token pair.
    - `POST /api/auth/mobile/google` — verify Google ID token (mobile-specific client ID).
    - `POST /api/auth/mobile/refresh` — refresh access token using refresh token.
    - `POST /api/auth/mobile/logout` — revoke refresh token.
    - `POST /api/account/link` — link an additional provider to current user (after email verification).
    - `DELETE /api/account` — soft delete (sets `deleted_at`).
    - `POST /api/account/restore` — undelete within grace window.

### E. Technical ✅ ANSWERED 2026-05-19

20. **Backend:** **Stays on Vercel + Turso + Drizzle for v1.** Mobile work only adds new endpoints. **Plan a Turso → Postgres migration as a future task** (Supabase, Neon, or self-hosted — TBD). Trigger to revisit: when mobile sync write throughput becomes a bottleneck, or when Turso's branch/replica costs outweigh a managed Postgres alternative. Not v1 work; track in a separate doc.

21. **Real-time features in v1:** **None.** Friends/leaderboard deferred per Section B, so no WebSocket/Pusher/Supabase Realtime infra needed. All API calls stay request/response. Push notifications cover the "live-feeling" retention surface.

22. **Sentry:** **Yes — `@sentry/react-native`, same Sentry org as web.** Same project initially is fine; split into a mobile-specific project if signal-to-noise becomes a problem during beta. Existing server-side `instrumentation.ts` stays untouched.

23. **Push notifications v1:**
    - **Daily streak reminder** (user-configurable time, default 7pm local; sent only if daily challenge not yet completed)
    - **Weekly progress digest** (Sunday morning local time; server-side cron job aggregates the week's stats per user)

    _Deferred to post-v1:_ Streak save warning (probably v1.1 — biggest conversion lift), power-up expiry alerts (low frequency, low value), friend activity (depends on friends feature shipping).

    _Implementation:_ Expo Push Notifications service for the abstraction layer; backend cron job runs in Vercel Cron or a scheduled Supabase Edge Function. Time-zone aware — store `users.timezone` (new column).

24. **Minimum iOS version:** **iOS 15+.** Maximum addressable market (~99.5%) — important for an audience that often holds phones longer than the consumer average. No Live Activities or Interactive Widgets in v1 anyway (we deferred widgets in Section A), so the modern-API trade is moot for now. Expo SDK 53+ supports iOS 15+.

### F. Resources / process ✅ ANSWERED 2026-05-19

25. **Who's building:** **Solo, with AI assistance** (Claude Code / Cursor). No contractors at v1. Realistic timeline given solo + offline-first + IAP integration + ~88-component-equivalent UI scope: **4–6 months to TestFlight, possibly longer.** Estimate doesn't account for unknowns — first React Native + Expo project can have a learning-curve tax.

26. **Timeline:** **Open-ended — ship when ready.** No hard launch date. Build to quality. Avoid the trap of feature-creeping toward "full parity v1" — Section B already constrained the cut, hold the line.

27. **Bar for "done":** Already locked in Section A — TestFlight beta for 3–6 months, then public launch.

28. **Next concrete output from this doc:** **API contract audit.** Map every mobile-side data need to (a) existing endpoints, (b) endpoints needing modification for mobile, (c) net-new endpoints. This work surfaces backend prep that can start before mobile code is written — and is the highest-leverage thing to know before the first sprint.

### Solo + AI build implications

- Phasing matters more than for a team build — can only do one thing at a time, so a dependency-aware sprint plan prevents wasted work.
- IAP / push / sync are gnarly areas where AI assistance helps less (lots of platform-specific gotchas). Budget extra time for these.
- Plan to use Expo EAS Build (managed cloud build) — no Xcode local-build chain to maintain.
- Use TestFlight from the very first build to dogfood the App Store submission flow end-to-end (it's bureaucratic — surfacing issues early is the only way to avoid launch-day surprises).
- Bundle ID, App Store Connect record, certificates, provisioning profiles, App Privacy disclosures — all need to be set up in week 1, not month 5.

---

## 5. Open considerations & risks

- **Apple App Store review risk for educational/exam-prep apps:** Apps that "appear to be a web wrapper" are commonly rejected. Capacitor and PWA-wrapped apps need clear native value. Native Swift has the easiest review path.
- **Question bank IP:** if questions ship bundled, they're extractable from the .ipa. If that matters, fetch-on-demand is safer.
- **Subscription parity:** users who subscribed on web shouldn't have to re-pay on iOS. Solution requires a "link account" flow.
- **Existing build errors:** `bookmarks/page.tsx` has unrelated TypeScript errors (per project memory). Resolve before any code reuse exercise.
- **Showdown collision:** if Showdown ships first on React Native, and this app ships in Swift, the team owns two stacks. If they converge on React Native, single stack but more rewrite work for Showdown's team.
- **API surface stability:** 60+ endpoints. A mobile client will lock the shape of these. Worth an API audit + versioning strategy before mobile work starts.
- **Theming:** the app supports light/dark via MutationObserver + class on `documentElement`. iOS dark mode is system-driven. Theme toggle UI will need redesign.
- **Onboarding tour (react-joyride):** doesn't translate to any native stack — needs full rebuild in whatever framework wins.

---

## 6. Recommendation (tentative — to be validated by the answers above)

**Default recommendation: Option B (React Native + Expo)** unless answers to Q1, Q3, or Q4 push toward Option A.

Reasoning:
- Showdown is already planned in React Native — converging stacks means one mobile codebase, one CI pipeline, one team competency.
- TypeScript + React reuse is real. SRS algorithm, Watts math, calculator formulas can be lifted near-verbatim into RN.
- Cross-platform Android comes nearly free, which matters for a market (electricians) that skews Android in many regions.
- Apple App Store accepts well-built RN apps without friction.
- Worse than Swift on raw polish, but the gap is closeable and the time savings are large.

**Fallback to Option A (Native Swift)** if:
- iOS-only is permanent
- Showdown is being killed or kept separate forever
- Widgets, watchOS, Live Activities, or other Apple-specific features are core to the value prop

**Avoid Option C (Capacitor)** unless we are explicitly time-boxed (<1 month) and willing to take App Store review risk. The current Next.js setup (SSR, no static export) makes Capacitor especially painful.

---

## 7. Next steps

All Section 4 decisions are locked. The build is unblocked from a planning standpoint. Pre-build work that should happen before sprint 1:

- [x] **API contract audit** — completed 2026-05-20. See [mobile-api-audit.md](./mobile-api-audit.md). Headline: 26 endpoints READY, 12 MOD, 6 REPLACE, 9 WEB-ONLY, 18 net-new. ~35 working days backend effort (~7–9 weeks solo) before full sprint 1 can start, but only ~7 days of hard blockers; remaining backend work can run in parallel with mobile sprint 1.
- [ ] **Apple Developer account** — confirm enrollment, organizational seat, signing identity. Banking info for IAP payouts.
- [ ] **App Store Connect record** — reserve bundle ID `com.sparkypass.app` (or similar), create the app shell, configure App Privacy disclosures (data types collected — many for this app: identifiers, usage data, purchase history).
- [ ] **RevenueCat account** — create project, link to App Store Connect, configure subscription products (`sparkypass_monthly_1499`, mirror web pricing).
- [ ] **Convergence with [[SparkyPass Showdown]]** — both products now on React Native + Expo. Decide repo structure (monorepo vs separate), shared component library plan, shared Sparky/audio/Watts UI primitives. Worth a separate sub-plan.
- [ ] **Phased sprint plan** — once API audit is done, draft sprint 1–N with acceptance criteria.
- [ ] **App Store branding** — icon, screenshots, app name, keywords, category, description. Can run in parallel with development.
- [ ] **Privacy policy and terms** — mobile-specific additions to existing web policies (data collected on-device, biometric, push token, etc.).
- [ ] **Turso → Postgres migration** — flagged as a future task, not v1. Track in a sibling doc when triggered.

---

## 8. Decisions log

_Add entries as decisions get made._

- 2026-05-13 — Doc created.
- 2026-05-13 — Section A answered. **Stack locked: React Native + Expo + TypeScript** (Option B). Convergence with [[SparkyPass Showdown]] codebase. iOS-first, Android optional. TestFlight beta period (3–6 mo) before public launch. Mobile is the long-term primary product; web will eventually become secondary/marketing. Widgets and watchOS deferred past v1.
- 2026-05-13 — Section B answered. **v1 scope: "core + retention loop"** — quiz engine, daily challenge, SRS+Circuit Breaker, Watts/Voltage/Amps, Sparky, bookmarks, flashcards, streak fuse power-up, referrals, Power Grid viz. Deferred: minigames, mock exam, load calculator, friends/leaderboard. **Full offline-first** with local SQLite, append-only Watts ledger, conflict resolution on sync. **Hybrid question bank** — Apprentice/Journeyman bundled, Master fetched. Target: ~4–6 months to TestFlight.
- 2026-05-18 — Section C answered after two research passes (Apple policy + developer-reported empirical data). **Option C — Apple IAP from day one** via RevenueCat + `react-native-purchases`. SBP rate 15%. IAP integrated in TestFlight builds with promo codes for testers (paywall validated during beta). **iOS price matches web at $14.99/mo** (accept ~$2/sub margin trade for cross-platform user trust; revisit at $1M ARR). **Honor existing Stripe entitlements**, no migration. Power-ups stay Watts-only. Unified entitlement record on backend, fed by both Stripe webhook and Apple S2S Notifications. Future External Purchase Link option preserved but not v1.
- 2026-05-19 — Section D answered. **Sign-in: Apple + Google + Email at equal weight.** SiwA mandatory per Guideline 4.8. **Auto-link accounts by email** with explicit user confirmation (no silent merges; "Hide My Email" relay handled). **30-day soft-delete grace period** per Guideline 5.1.1(v). **Long-lived refresh token (90-day sliding) in Keychain, no biometric prompts in v1.** Seven new backend auth endpoints to add (mobile-specific, alongside existing NextAuth).
- 2026-05-19 — Section E answered. **Backend stays on Vercel + Turso + Drizzle** for v1 (only new mobile endpoints added). **Turso → Postgres migration flagged as a future task**, not v1. **No real-time infra in v1** (friends/leaderboard deferred). **Sentry: `@sentry/react-native`, same org as web.** **Push notifications in v1: daily streak reminder + weekly digest** (streak-save warning deferred to v1.1). **Minimum iOS 15+** for maximum reach on an audience that holds phones longer.
- 2026-05-19 — Section F answered. **Solo build with AI assistance**, no contractors at v1. **Open-ended timeline** — ship to TestFlight when ready (~4–6 months realistic). Hold the line on Section B scope; resist feature creep. **Next concrete output: API contract audit**, then phased sprint plan. Planning phase complete; build phase blocked only on the API audit and Apple Developer setup tasks.
- 2026-05-20 — API contract audit completed. See [mobile-api-audit.md](./mobile-api-audit.md). 26 endpoints READY out of 53 existing — backend in better shape than expected. 18 net-new endpoints fully spec'd. 35-task backend prep checklist with day estimates. **~7 days of hard-blocker backend work** (schema, mobile auth shim) before mobile sprint 1 can begin; remaining ~28 days of backend work parallelizes with mobile sprint 1+. Surfaced 9 open questions including Hide-My-Email linking-flow gap (+1d) and a recommendation to use RevenueCat as the entitlement source-of-truth.
- 2026-05-20 — **All 9 audit open questions resolved.** 8/9 accepted recommended answers. OQ#9 deviated: feedback Watts reward kept at public launch, with rate-limit + length-min + manual moderation queue + Watts gating mitigation (+0.5d backend). OQ#5 added Hide-My-Email pre-auth linking endpoints (+1d). OQ#8 deferred account export to v1.1 (−1d). **Net total backend estimate: ~35.5 days** (effectively unchanged from initial ~35). Backend critical path is unblocked — pre-build phase is complete.
- 2026-05-20 — **Build phase started — Phase 1 hard blockers complete, Phase 3 ~80% complete.** Shipped: migrations 0019 + 0020; mobile auth shim (`lib/auth-mobile.ts` — JWT mint/verify + opaque refresh tokens with strict rotation + 30s grace + theft revocation + OAuth user resolution with restore-on-same-provider); wrapped `auth()` in `auth.ts` so all 26 ready routes accept Bearer tokens transparently; 7 mobile auth endpoints (apple/google/email/refresh/logout/link-request/link-confirm); soft-delete enforced at auth choke points + auth-bypassing flows; account DELETE + link endpoints with restore-on-sign-in across all auth paths; RevenueCat webhook; question-pack manifest + tier download with 304 support; push-token + notification-prefs + timezone endpoints; feedback rewrite to persist + gate Watts on moderation, with admin list + moderate routes; sessions idempotent create + end (no double-award on retry); watts/transactions pagination; `/api/sync/upload` (7 event types) + `/api/sync/state` (delta-based with `since` cursor). Full `tsc --noEmit` clean. Both migrations verified on a temp copy of local DB. **Standalone `/api/account/restore` deemed unnecessary** — restore-on-sign-in covers the UX without an extra endpoint. **Still pending** (tracked in build-todo): Stripe-webhook → RC mirroring, hard-delete cron, streak/digest/resistance crons + Expo HTTP push integration, admin moderation UI page, idempotency on review completes. New env vars required pre-deploy: `MOBILE_JWT_SECRET`, `GOOGLE_IOS_CLIENT_ID`, `APPLE_IOS_BUNDLE_ID`, `REVENUECAT_WEBHOOK_SECRET`, `ADMIN_USER_IDS`.
