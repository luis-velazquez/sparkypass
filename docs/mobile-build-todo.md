# SparkyPass Mobile — Master Build TODO

**Status:** Build phase active. Phase 1 hard blockers + Phase 3 backend soft blockers **complete** (2026-05-21). **Repo structure decided 2026-06-02: Option β** — two repos + shared `sparkypass-ui` package; see convergence sub-plan. Phase 2 bootstrap unblocked once shared package lands. **Audit + 5 decisions locked 2026-06-08** (sync → durable-outbox/server-authoritative; streak-save push → v1; analytics+flags → Sprint 1; NEC 2020 → v1; reward-model reconciliation) — see plan §8 Decisions log. Pricing reframe deferred.
**Pairs with:** [mobile-conversion-plan.md](./mobile-conversion-plan.md) (decisions), [mobile-api-audit.md](./mobile-api-audit.md) (backend specs), [mobile-showdown-convergence.md](./mobile-showdown-convergence.md) (repo + shared-package decision)
**Owner:** Solo + AI

This is the master tracker. Check items off as they ship. New tasks discovered during build go at the bottom of the relevant phase or in §Open follow-ups.

Day estimates assume solo + AI. Calendar weeks ≈ days × 1.25–1.5 to account for context switches and learning curve on first-time-on-stack work.

---

## Phase 0 — Admin prerequisites (parallel to code)

These don't block local dev but block real deployment / TestFlight. Start them now; they have lead times (Apple banking verification, App Store Connect propagation).

- [ ] Enroll in Apple Developer Program ($99/yr) — confirm Luis's account or org seat
- [ ] Banking + tax info in App Store Connect (for IAP payouts) — slowest item, ~1–2 weeks
- [ ] Reserve bundle ID `com.sparkypass.app` (or chosen alternative) in App Store Connect
- [ ] Create App Store Connect app record (name, primary language, SKU)
- [ ] Configure App Privacy disclosures (data types collected: identifiers, usage data, purchase history, etc.)
- [ ] Create signing identity + provisioning profiles (or let EAS Build manage them)
- [ ] Create RevenueCat account, link to App Store Connect
- [ ] Create RC project + subscription product `sparkypass_monthly_1499` (matches web $14.99/mo)
- [ ] Create RC entitlement `pro` (the single entitlement gating premium features)
- [ ] Mobile-specific Google OAuth client ID (iOS) — Google Cloud Console
- [ ] Apple Push Notification key (.p8) for backend → APNs (via Expo's push service)
- [ ] EAS account + project link

---

## Phase 1 — Backend hard blockers ✅ COMPLETE 2026-05-20

### 1A. Schema migrations ✅

- [x] **Migration 0019** — additive columns + auth/sync tables — `drizzle/0019_mobile_foundation.sql`
  - users.deleted_at, timezone, subscription_source, apple_original_tx_id, notification_prefs
  - refresh_tokens, push_tokens, linked_providers, sync_event_log, link_codes
- [x] **Migration 0020** — feedback table — `drizzle/0020_feedback_table.sql`
- [x] Soft-delete audit pass — auth choke points (auth.ts wrapper + NextAuth jwt/signIn/credentials callbacks) plus auth-bypassing routes (register, forgot-password, reset-password, verify-email, verify-email/resend, set-password)

### 1B. Mobile auth shim ✅

- [x] `lib/auth-mobile.ts` — signAccessToken, verifyAccessToken, getMobileSession (with soft-delete rejection), createTokenPair, rotateRefreshToken (strict rotation + 30s grace), revokeRefreshToken, resolveOAuthUser (with restore-on-same-provider)
- [x] `auth.ts` — wrapped `auth()` accepts Authorization: Bearer header OR NextAuth cookie; all ~26 ready routes transparently mobile-ready

### 1C. Mobile auth endpoints ✅

- [x] `POST /api/auth/mobile/email` — `app/api/auth/mobile/email/route.ts` (includes restore-on-signin)
- [x] `POST /api/auth/mobile/google` — `app/api/auth/mobile/google/route.ts` (Google JWKS, conflict + conflict_deleted handling)
- [x] `POST /api/auth/mobile/apple` — `app/api/auth/mobile/apple/route.ts` (Apple JWKS, nonce verify, Hide-My-Email aware)
- [x] `POST /api/auth/mobile/refresh` — `app/api/auth/mobile/refresh/route.ts` (strict rotation + 30s grace, theft revocation)
- [x] `POST /api/auth/mobile/logout` — `app/api/auth/mobile/logout/route.ts`
- [x] `POST /api/auth/mobile/link-request` — `app/api/auth/mobile/link-request/route.ts` (rate-limited, anti-enum, 6-digit code via Resend)
- [x] `POST /api/auth/mobile/link-confirm` — `app/api/auth/mobile/link-confirm/route.ts`

**Phase 1 acceptance: MET.** All routes ship, full typecheck passes, migrations verified against a temp copy of the local DB.

**Env vars to set before deploying:**
```
MOBILE_JWT_SECRET=<openssl rand -base64 64>
GOOGLE_IOS_CLIENT_ID=<from Google Cloud Console iOS client>
APPLE_IOS_BUNDLE_ID=com.sparkypass.app  # or your chosen bundle
REVENUECAT_WEBHOOK_SECRET=<RC dashboard → webhook config>
ADMIN_USER_IDS=<your-user-id>           # comma-separated for /admin/feedback access
```

---

## Phase 2 — Mobile project bootstrap (~2 days)

Can start as soon as Phase 1B is done. Most of this is one-time setup.

- [x] **Repo structure decided 2026-06-02: Option β** (two repos + shared `sparkypass-ui` package). See [mobile-showdown-convergence.md](./mobile-showdown-convergence.md).
- [ ] **Prereq:** Stand up `sparkypass-ui` shared package + migrate Showdown to consume it (~½ day). Blocks the mobile bootstrap only in the sense that the new `sparkypass-mobile` repo should consume the shared package from its first commit.
- [ ] `npx create-expo-app sparkypass-mobile --template blank-typescript`
- [ ] Install core deps: expo-router, expo-secure-store, expo-apple-authentication, expo-notifications, expo-local-authentication (deferred but install now), expo-sqlite, react-native-mmkv, zustand, @tanstack/react-query, react-native-reanimated, expo-haptics
- [ ] EAS configure (`eas build:configure`)
- [ ] Set up env handling (`.env.development`, `.env.preview`, `.env.production` + `extra` field in app.config.ts)
- [ ] App icon placeholder + splash screen (uses Sparky brand)
- [ ] Tailwind/NativeWind setup OR design tokens (decide — NativeWind likely the fastest path given web uses Tailwind)
- [ ] Sentry React Native install + DSN
- [ ] First EAS dev build → verify boots on physical iPhone via TestFlight Internal

---

## Phase 3 — Backend soft blockers (parallel with mobile sprint 1+)

Each ships as backend work between mobile sprints. Order is flexible; sync is highest priority because mobile needs it for offline.

### 3A. Sync protocol ✅
- [x] `POST /api/sync/upload` — 7 event types (progress, session_start, session_end, bookmark_added/removed, flashcard_bookmark_added/removed), idempotency via sync_event_log unique index, ≤500 events/batch
- [x] `GET /api/sync/state` — user state + bookmark deltas with `since` cursor
- [ ] **Follow-up:** Watts/streak recalc inside sync (currently online PATCH /api/sessions still owns the canonical Watts award — sync only records raw facts)
- [ ] **Follow-up:** SRS + circuit-breaker deltas in /api/sync/state (clients can use existing /api/power-grid/[category] + /api/circuit-breaker/status for v1)

### 3B. Subscription / IAP unification ✅
- [x] `POST /api/webhooks/revenuecat` — bearer-secret auth, full RC event handler (INITIAL_PURCHASE/RENEWAL/CANCELLATION/EXPIRATION/BILLING_ISSUE/etc), mirrors to users row, idempotent
- [x] `/api/webhooks/stripe` modified — every users-row update now `.returning({ id })` and mirrors to RC via `pushSubscriberAttributes`; `subscriptionSource: "stripe"` set everywhere
- [x] `lib/revenuecat.ts` — `pushSubscriberAttributes` helper (POSTs to `/v1/subscribers/{id}/attributes`, no-ops if `REVENUECAT_SECRET_API_KEY` not set)
- [x] One-time backfill script — `scripts/backfill-stripe-rc.ts` (idempotent re-runnable, run via `npx tsx`)

### 3C. Account lifecycle ✅
- [x] `DELETE /api/account` — soft-delete with 30-day grace; **also cancels active Stripe subscription** (`cancel_at_period_end=true` so paid period isn't forfeited); Apple subscriptions documented as needing Settings → Apple ID action (Apple rules)
- [x] `POST /api/account/link` — Google + Apple, idempotent, refuses provider-taken
- [x] Restore-on-sign-in across all three auth paths. **Standalone `/api/account/restore` deemed unnecessary** — sign-in IS the restore signal.
- [x] Vercel Cron daily hard-delete sweep — `app/api/cron/hard-delete/route.ts`

### 3D. Push notifications backend ✅
- [x] `POST /api/push-tokens` — upsert by (user, device)
- [x] `DELETE /api/push-tokens/[token]` — user-scoped delete
- [x] `GET/PUT /api/user/notification-prefs` — pref blob with 15-min minute validation
- [x] `PUT /api/user/timezone` — IANA validation via Intl.supportedValuesOf
- [x] `lib/push.ts` — Expo HTTP push helper (`sendPushNotifications`, batches of 100, auto-cleans DeviceNotRegistered tokens)
- [x] `lib/cron-auth.ts` — `verifyCronRequest` (Vercel's `Authorization: Bearer $CRON_SECRET`)
- [x] Vercel Cron every 15 min — `/api/cron/streak-reminder` (tz-local match + 18h daily-challenge skip)
- [ ] **Streak-save warning branch — PULLED INTO v1 (2026-06-08).** Add to the existing `/api/cron/streak-reminder`: if `studyStreak ≥ 3` AND no qualifying session today AND local time is in the last ~2h before midnight → send the streak-save variant and **suppress** the generic reminder. The plan's own "biggest conversion lift"; near-free on the shipped cron.
- [x] Vercel Cron Sunday 14:00 UTC — `/api/cron/weekly-digest` (per-user 7-day stats)

### 3E. Content delivery ✅
- [x] `GET /api/question-packs` — manifest with per-tier ETag, 5-min cache
- [x] `GET /api/question-packs/[tier]` — full tier JSON with If-None-Match → 304

### 3F. Resistance penalties cron ✅
- [x] `lib/resistance.ts` — `applyResistanceForUser` factored out
- [x] `/api/resistance/check` refactored to use the shared helper
- [x] Vercel Cron hourly — `/api/cron/resistance` filters candidates to tz-local hour===3

### 3G. Polish & idempotency ✅ (cosmetic items deferred)
- [x] `POST /api/sessions` accepts `clientSessionId` for idempotent create
- [x] `PATCH /api/sessions` short-circuits if session already ended
- [x] `/api/review/complete` + `/api/review/weak-spots/complete` short-circuit on already-ended sessions
- [x] Pagination on `/api/watts/transactions` (`?before=&limit=`, returns `hasMore` + `nextCursor`)
- [ ] **Deferred (cosmetic):** `?slim=1` on bookmark routes
- [ ] **Deferred (cosmetic):** Standardize error envelopes across non-mobile-facing routes

### 3H. Feedback anti-spam ✅
- [x] Per-user 24h rate limit on `POST /api/feedback`
- [x] 50-char minimum, persists to new `feedback` table with `moderationStatus = 'pending'`
- [x] `GET /api/admin/feedback` — list moderation queue (ADMIN_USER_IDS gate)
- [x] `POST /api/admin/feedback/[id]/moderate` — approve/reject, idempotent; Watts awarded ONLY on approval via wattsTransactions
- [x] Admin UI page at `/admin/feedback` — client component with status filter pills, approve/reject buttons, optimistic remove

---

## Phase 4 — Mobile feature build

Sprints are roughly 2-week chunks. Each sprint should ship to TestFlight internal.

### Sprint 1: Foundation (~2 weeks)
- [ ] Auth UI: sign-in screen with Apple + Google + Email at equal weight (per Section D-15)
- [ ] Token storage in Keychain (expo-secure-store)
- [ ] Auth state machine (zustand + react-query)
- [ ] App shell: tab navigation (Dashboard / Quiz / Review / Profile)
- [ ] Dashboard screen: fetch `/api/user` + `/api/progress/stats`, render **Watts + classification rank** + streak + greeting (NO Amps gauge / Voltage-tier ladder — deprecated in code; lead with Watts)
- [ ] **Analytics + feature-flag foundation** (PostHog/Amplitude RN, offline-batched, remote-config) — events carry `platform/appVersion/osVersion/anon-deviceId`; instrument signup + first-session funnels (plan §E-24a). _Sprint 1, not Sprint 7._
- [ ] **Foundation a11y/theming rules** in the Sprint-1 primitives: WCAG-AA-validate the `sparkypass-ui` tokens once (before they propagate to 2 apps), no hardcoded font sizes (Dynamic Type), native system dark mode (not the web MutationObserver toggle), VoiceOver labels on Sparky/Watts components
- [ ] Sparky mascot component (port from web — 17 SVG expressions to react-native-svg)
- [ ] Settings screen: timezone, notification prefs, account info, delete account
- [ ] Network layer: tanstack-query setup with bearer-token interceptor, retry, offline error handling
- [ ] First end-to-end: sign in, see dashboard, sign out

### Sprint 2: Online quiz loop (~2 weeks)
- [ ] Category list screen (uses existing categories — port from web)
- [ ] Quiz screen: question card, multiple choice, swipe-to-reveal explanation
- [ ] Answer submission → `POST /api/progress` → update Watts/Voltage UI optimistically
- [ ] Quiz completion screen with Watts earned, confetti (lottie or react-native-confetti-cannon)
- [ ] Online-only sessions first (start/end via `/api/sessions`)
- [ ] Daily Challenge screen
- [ ] WattsEarnedToast component (port from web)

### Sprint 3: Offline data layer — durable outbox + server-authoritative compute (~2 weeks) *(reframed 2026-06-08)*
**Invariant:** on-device SQLite is a durable outbox + disposable read-cache, **NEVER the system of record.** Client renders optimistic UI from local rules but treats only the server's reconciled values as truth. This deletes the conflict matrix.
- [ ] **Backend prep:** extract `lib/award-session.ts` (Watts + streak + ledger insert, idempotent on `(userId, sourceSessionId)`) and `lib/ingest-answer.ts` (SM-2 + breaker), called by **both** `PATCH /api/sessions` and `/api/sync/upload` — closes the offline-session-earns-0-Watts hole (migration 0021: `source_session_id` + partial unique index on `wattsTransactions`)
- [ ] **Backend prep:** SRS scheduled from `answeredAt` (not server time) with server clamp to `[now−60d, now]`; circuit-breaker derived from recent contiguous answers (not replayed)
- [ ] **Backend prep:** re-key `sync_event_log` idempotency to `(userId, clientId)`; per-event transactions (claim can't burn on a throw); bump `users.updatedAt` only on ≥1 success
- [ ] On-device SQLite: append-only outbox table (raw events) + read-cache tables
- [ ] `user_version`-pragma migration runner + nuke-and-rebuild-from-`/api/sync/state` fallback
- [ ] Sync engine: drain outbox → `POST /api/sync/upload`; overwrite local read-models from `GET /api/sync/state`
- [ ] Network-state observer (NetInfo) — auto-sync on reconnect; outbox survives app-kill mid-sync
- [ ] **E2E acceptance:** airplane mode → take quiz → kill app mid-sync → upgrade schema → restore network → server state correct, no lost/double events, Watts/streak awarded

### Sprint 4: SRS + Circuit Breaker (~2 weeks)
- [ ] Daily Review screen (uses `/api/review/due`)
- [ ] Weak Spots Review screen
- [ ] Circuit Breaker UI per category (tripped state, cooldown timer, reset-with-Watts button)
- [ ] Power Grid visualization (port from web — category mastery viz)
- [ ] Streak tracking + classification/rank UI (Watts-driven; lead the HUD with Watts)
- [ ] ~~Amps gauge~~ **CUT (2026-06-08)** — `amps.ts` = correct-answer count, not a multiplier; a near-static "Amps" gauge collides with electricians' real-world knowledge (amps = current). Put P=V×I on one optional "how scoring works" card instead.

### Sprint 5: Bookmarks + Flashcards + Power-ups (~1.5 weeks)
- [ ] Bookmarks list + review mode
- [ ] Flashcards screen with bookmark toggle
- [ ] Power-ups screen (only Streak Fuse purchase available v1)
- [ ] Referral screen (referral code display, share-sheet integration)

### Sprint 6: IAP + Push + Account Lifecycle (~2 weeks)
- [ ] RevenueCat SDK integration (`react-native-purchases`)
- [ ] Paywall screen with subscribe + restore-purchase
- [ ] Trial countdown banner
- [ ] Sign in with Apple — link existing account flow (Hide-My-Email path)
- [ ] Push notification permission request flow
- [ ] Streak reminder picker UI (15-min increments per OQ#7)
- [ ] Account deletion flow with 30-day grace explanation

### Sprint 7: Polish + App Store submission (~2 weeks)
- [ ] Onboarding flow (port simplified version — no react-joyride)
- [ ] Accessibility audit (VoiceOver labels, dynamic type, contrast)
- [ ] Loading skeletons + error states for every screen
- [ ] Crash reporting verified (Sentry working in production builds)
- [ ] App Store screenshots (6.5" iPhone, 6.1" iPhone, 5.5" iPhone) — 5–10 per device
- [ ] App Store description, keywords, support URL, marketing URL
- [ ] Privacy policy URL + Privacy Manifest file (PrivacyInfo.xcprivacy)
- [ ] Submit for TestFlight external beta review

---

## Phase 5 — Beta + public launch (3–6 months in TestFlight, then public)

- [ ] Recruit initial 20–50 TestFlight testers (existing SparkyPass subscribers + electrician communities)
- [ ] Promo code distribution for testers (bypass IAP — OQ-style decision in plan §C-12)
- [ ] Bi-weekly Expo OTA updates during beta
- [ ] Crash + funnel data review cadence (weekly)
- [ ] Decision gate: ready for public launch? (criteria: <0.5% crash-free rate floor, paywall conversion data positive, no P0 bugs open for >2 weeks)
- [ ] App Store production submission
- [ ] Public launch comms (web banner, email blast, social)
- [ ] Post-launch v1.1 backlog seeded from beta feedback

---

## Out of scope for v1 (track for v1.1+)

Deferred per planning §B-6. Move to a separate `mobile-vnext.md` when v1 ships.

- 4 minigames (Index Sniper, Translation Engine, Formula Builder, Index Game)
- Mock exam engine
- Load Calculator (residential + commercial)
- Friends / Leaderboard / friend requests
- Full power-ups shop (only Streak Fuse in v1)
- Admin tools
- Account data export (per OQ#8)
- ~~Streak save warning push (deferred to v1.1)~~ → **moved to v1 (2026-06-08)**, see Phase 3D
- Apple Watch app
- Home screen widgets
- Live Activities
- Android port

---

## Open follow-ups (discovered during build)

_Add as found._

**From the 2026-06-08 audit (decisions in plan §8):**
- [ ] **NEC 2020 as first-class cycle (v1)** — add `2020` to `NecVersion`, state→cycle map in onboarding, flag/gate cross-cycle answer changes, label the verified cycle. Full 2020 answer-key authoring = parallel content track.
- [x] **Reward-model rank-curve redesign — DONE 2026-06-09.** Replaced the 0/1K/1M/1B curve with a **10-rank SI-Watt-prefix ladder** (Milliwatt→Yottawatt) at 0/1k/3k/7.5k/15k/28k/48k/75k/110k/160k lifetime Watts. **Also fixed a second latent bug:** rank was keyed off `wattsBalance` at every call site, so spending a power-up demoted you — switched all ~10 server routes + 2 client pages to `wattsLifetime` (monotonic). Folded colors/greeting/advancement copy into the `CLASSIFICATIONS` array (deleted the 3 parallel maps in `sparky-messages.ts` + `VoltageDisplay.tsx`); adding a rank is now a one-line edit. `tsc --noEmit` clean. Applies to the live web app; mobile inherits it.
- [ ] **Content-ops loop** — in-app "report this question" → triage queue (reuse the `feedback`/moderation table + admin UI already built); per-question provenance (`verifiedAgainstCycle`, `verifiedAt`); prefer fetch-on-demand content so a fix ships via the `/api/question-packs` ETag path, not an App Store release.
- [ ] **Operator runbook** (pre-TestFlight) — EAS Update channels + canary cohort + `runtimeVersion` discipline + one-command rollback; Sentry release-health tied to EAS build/update IDs; real support intake; `SKStoreReview.requestReview` at a genuine peak (first mock pass / streak milestone, never after a wrong answer).
- [ ] **Showdown ↔ SparkyPass house-ad cross-sell** (v1.1) — no-account-link deep links both directions; instrument cross-installs; keep deeper account-linking deferred per convergence doc.
- [ ] **Pricing reframe (deferred)** — annual plan + exam-window (non-renewing) pass + 7-day card-on-file trial + metered freemium; confirm/kill the "$14.99 matches web" framing. Own dedicated pass.
- [ ] **Load Calculator (v1.1, top of backlog)** — carve ONE non-gamified tool on the 635-LOC pure-TS NEC engine in `app/load-calculator/_shared/nec/`; job-site utility Pocket Prep lacks. NOT v1.

- [ ] Repo structure decision (Phase 2 first item) — affects Showdown convergence
- [ ] Showdown convergence sub-plan — separate doc when repo decision lands
- [ ] Decide hosting for question-pack downloads if/when Vercel direct-serve costs grow
- [ ] Decide AI-generated feedback detection heuristic (post-v1, per OQ#9 follow-up)
- [ ] Sparky mascot SVG → react-native-svg port — verify all 17 expressions render correctly
