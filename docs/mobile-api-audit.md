# SparkyPass Mobile — API Contract Audit

**Date:** 2026-05-20
**Status:** Complete. Sprint 1 prep checklist at end (Section 4).
**Pairs with:** [mobile-conversion-plan.md](./mobile-conversion-plan.md) (Sections 1.5, 4, 7)

---

## 1. Summary

Audited every route handler under `app/api/`. Total: **53 existing route entries** (44 unique route files, several exporting multiple methods).

| Bucket | Count | What it means |
|---|---|---|
| READY | 26 | Works as-is once mobile JWT auth resolves to a `session.user.id`. |
| MOD | 12 | Logic stays, but response shape, sync semantics, or auth wiring needs adjustment. |
| REPLACE | 6 | Being superseded by a net-new mobile equivalent (mostly auth, password flows). |
| WEB-ONLY | 9 | Stripe checkout/portal redirects, web feedback, deferred-feature endpoints (friends, leaderboard, game-packs/mastery). |
| **Net-new** | **18** | Auth (5), Account (4), Subscriptions (2), Content (2), Sync (2), Push (3 — including timezone). |

**Headline finding:** the backend is in surprisingly good shape for mobile. The core quiz/SRS/Watts/Circuit Breaker/Power Grid/Bookmarks/Flashcards routes already use `auth()` from NextAuth in a way that maps cleanly onto a JWT-bearer middleware. The expensive work is concentrated in three areas: (a) the mobile auth stack and refresh-token table, (b) the offline sync protocol, and (c) the unified entitlement store fed by both Stripe and Apple S2S.

**Sync recommendation (Section 3, "Sync"):** delta-based push/pull with a per-table `since` cursor. Full state snapshots are simpler but won't scale beyond a few weeks of Watts ledger history; we already have monotonically-increasing `createdAt` / `answeredAt` columns across the relevant tables.

---

## 2. Existing endpoint audit

Routes grouped by domain. All routes use `auth()` from `@/auth` (NextAuth v5 JWT session) unless noted. "Mobile auth" in the Auth column means the route currently calls `auth()` and will work once mobile JWT verification resolves to a `session.user.id` — concretely, a request-scoped `auth()` shim that accepts a Bearer access token (signed by our own `/api/auth/mobile/*` endpoints) and returns the same `Session` shape.

### Auth, registration, password

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers (OAuth callbacks, credentials, session, providers) | Public | WEB-ONLY | Web NextAuth flow stays. Mobile uses native `/api/auth/mobile/*` instead. Keep alive for web. |
| `/api/register` | POST | Email+name signup, sends verification email | Rate-limited | MOD | Reuse on mobile. Currently returns `{success, userId, email}` — fine. **Mod:** accept optional `appleSubject` / `googleSub` for OAuth-first signups via mobile endpoints so we don't duplicate user-creation logic. Also: web sets `betaAgreedAt = now` unconditionally; mobile won't have the beta-tester concept post-launch — gate on a `source` field. |
| `/api/forgot-password` | POST | Send password-reset email | Rate-limited | READY | Mobile WebView or in-app form posts here, then web link in email handles reset. |
| `/api/reset-password` | POST | Consume reset token, set new password | Rate-limited | READY | Token comes from email link → web page. No mobile change needed. |
| `/api/set-password` | POST | First-time password set after email verification | Public+token | READY | Same model as web. |
| `/api/verify-email` | POST | Consume verification token | Public+token | READY | Token from email; verify can happen on web. |
| `/api/verify-email/resend` | POST | Resend verification email | Rate-limited | READY | |
| `/api/settings/password` | POST | Authenticated user changes their password (requires current) | `auth()` | READY | |
| `/api/settings/username` | PATCH | Update name/username/city/state | `auth()` | READY | |

### Subscription / billing (web only — IAP replaces on mobile)

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/stripe/checkout` | POST | Create Stripe checkout session, returns redirect URL | `auth()` | WEB-ONLY | Apple guideline 3.1.1 forbids linking to web checkout from inside the iOS app. Web only. |
| `/api/stripe/portal` | POST | Stripe customer portal redirect | `auth()` | WEB-ONLY | Mobile users manage subscriptions via Apple ID settings. |
| `/api/stripe/verify-session` | POST | Verify checkout completion, update subscription | `auth()` | WEB-ONLY | Web success-page handshake only. |
| `/api/webhooks/stripe` | POST | Stripe webhook — updates `users.subscriptionStatus`, period end, etc. | Stripe signature | MOD | Logic stays, but mobile build requires this and the new `/api/webhooks/apple` to write a **single unified entitlement record**. See Section 3 "Subscriptions" — likely a `user_entitlements` table or wider columns on `users` with a `source` discriminator. |

### Profile & user data

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/user` | GET | Lightweight user state: name, username, watts, voltage classification, streak, exam date, NEC year, onboarding flags | `auth()` | READY | This is the dashboard hot path. Mobile uses it on every launch. |
| `/api/profile` | GET | Full profile (settings + subscription) | `auth()` | READY | |
| `/api/profile` | PATCH | Update settings (exam date, hints, focus mode, NEC year, onboarding flags) | `auth()` | MOD | **Add:** `timezone` (IANA, e.g. `America/Los_Angeles`) for push-notification scheduling. Add `notificationPrefs` object. |
| `/api/profile` | POST | Complete profile (username + DOB + city/state) after signup | `auth()` | READY | Mobile reuses for first-time profile completion. |

### Quiz / progress / SRS / circuit breaker

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/progress` | POST | Record one answered question; updates `userProgress`, `questionSrs` (SM-2), and `circuitBreakerState` atomically | `auth()` | MOD | This is the workhorse. **Mod:** support an "offline batch" via `/api/sync/upload` (Section 3 Sync). Keep single-question POST for online realtime path. Also: add optional `answeredAt` client timestamp so the server can preserve offline ordering. |
| `/api/progress/stats` | GET | Aggregate stats: lifetime answers, accuracy, today, category breakdown, recent sessions, daily challenge status, classification | `auth()` | READY | Big response (~3 KB), but mobile loads it once per dashboard refresh. |
| `/api/sessions` | POST | Start a study session (returns sessionId) | `auth()` | MOD | **Mod:** accept a client-generated UUID so offline sessions can be reconciled without a round-trip. Field name: `clientSessionId`. Server stores whichever one wins (idempotent insert). |
| `/api/sessions` | PATCH | End a session, calculate Watts server-side, update streak, classification, log transaction | `auth()` | MOD | Same idempotency requirement. Mobile may PATCH a session that was POSTed in an earlier offline batch. Add an `idempotencyKey` field. |
| `/api/quiz-results` | POST | Record final score for a difficulty | `auth()` | READY | |
| `/api/quiz-results` | GET | Latest result per category, with highest-passed-difficulty rollup | `auth()` | READY | |
| `/api/quiz-results/best` | GET | Best percentage for a category+difficulty | `auth()` | READY | |
| `/api/quiz-results/unlocks` | GET | Apprentice/Journeyman/Master unlock status per category | `auth()` | READY | |
| `/api/circuit-breaker/status` | GET | Per-category breaker state and cooldown remaining | `auth()` | READY | |
| `/api/circuit-breaker/reset` | POST | Spend Watts to reset a tripped breaker | `auth()` | READY | |
| `/api/review/due` | GET | Due SRS questions, prioritized, with category filter | `auth()` | READY | |
| `/api/review/complete` | POST | End a review session, award Watts (server-side calc) | `auth()` | MOD | Same idempotency/clientSessionId need as `/api/sessions`. |
| `/api/review/weak-spots` | GET | High-wrong-count questions, 24h cooldown filter | `auth()` | READY | |
| `/api/review/weak-spots/complete` | POST | End weak spots session, award Watts | `auth()` | MOD | Same idempotency need. |

### Watts / Voltage / Resistance

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/watts/transactions` | GET | Last 50 ledger entries + balance | `auth()` | MOD | **Mod:** add pagination (`?before=<createdAt>&limit=50`) so the ledger UI can scroll back further. Also: this needs to expose enough state for the device's local ledger to reconcile (return the latest server `createdAt` so client knows what it has). |
| `/api/voltage` | GET | Voltage tier + progress to next | `auth()` | READY | |
| `/api/resistance/check` | GET | Apply daily resistance penalties (missed-day, overdue SRS) | `auth()` | MOD | **Mod:** currently called by the web dashboard on page load. Mobile needs to call this at app-foreground, BUT the calculation uses server-side dates. With offline-first, a user could be 3 days offline and we'd over-penalize. Decision needed: either run server-side via cron at 3am user-local-time (requires `users.timezone`), or pass `clientLastActiveAt` and let server reconcile. Recommend the cron approach — see open question #4. |

### Power-ups, Game continue/hint (in-quiz Watts spends)

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/power-ups` | GET | Available + active + inventory + balance | `auth()` | READY | |
| `/api/power-ups/purchase` | POST | Spend Watts → power-up | `auth()` | READY | v1 mobile only uses Streak Fuse purchases; route accepts a `type` so it's fine. |
| `/api/power-ups/activate` | POST | Activate a purchased power-up | `auth()` | READY | |
| `/api/game-continue` | POST | Spend 1000W to continue after strikeout | `auth()` | WEB-ONLY | Minigame-specific; minigames deferred per Section B. |
| `/api/game-hint` | POST | Spend 100W for hint | `auth()` | WEB-ONLY | Minigame-specific. |
| `/api/game-mastery` | POST | Update mastery-based pack unlocks | `auth()` | WEB-ONLY | Mastery-game-specific. |
| `/api/game-packs` | GET | Game pack catalog + owned + mastery | `auth()` | WEB-ONLY | Mastery-game-specific. |
| `/api/game-packs/purchase` | POST | Buy a game pack with Watts | `auth()` | WEB-ONLY | Mastery-game-specific. |

### Bookmarks & flashcards

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/bookmarks` | GET | List bookmarks enriched with question text | `auth()` | MOD | **Mod:** the response embeds full question text from the bundled question bank — fine on web, redundant on mobile when questions are already in local SQLite. Add a `?slim=1` mode that returns just `[{id, questionId, createdAt}]`. Saves ~80% payload. |
| `/api/bookmarks` | POST | Add bookmark | `auth()` | READY | Will be called via sync queue. |
| `/api/bookmarks` | DELETE | Remove bookmark by questionId | `auth()` | READY | |
| `/api/bookmarks/[id]` | DELETE | Remove bookmark by id | `auth()` | READY | |
| `/api/flashcard-bookmarks` | GET | List flashcard bookmarks enriched with card content | `auth()` | MOD | Same `?slim=1` consideration. |
| `/api/flashcard-bookmarks` | POST | Add | `auth()` | READY | |
| `/api/flashcard-bookmarks` | DELETE | Remove by flashcardId | `auth()` | READY | |

### Power Grid

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/power-grid` | GET | All categories with status (energized/browned-out/de-energized/flickering), accuracy, SRS health | `auth()` | READY | Read-only aggregate. |
| `/api/power-grid/[category]` | GET | Per-category drilldown: stats, SRS, breaker, mastery breakdown, recent quizzes | `auth()` | READY | |

### Social (deferred features)

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/friends` | GET | List friends + pending requests | `auth()` | WEB-ONLY | Friends/leaderboard deferred per Section B. |
| `/api/friends/request` | POST | Send friend request by email | `auth()` | WEB-ONLY | Deferred. |
| `/api/friends/[id]` | PATCH/DELETE | Accept/decline/block/remove | `auth()` | WEB-ONLY | Deferred. |
| `/api/leaderboard` | GET | Global leaderboard | `auth()` | WEB-ONLY | Deferred. |
| `/api/referral` | GET | Get/create user's referral code | `auth()` | READY | v1 mobile keeps referrals. |
| `/api/referral` | POST | Redeem code during signup | Public | READY | |

### Misc

| Endpoint | Method | Purpose | Auth | Status | Notes |
|---|---|---|---|---|---|
| `/api/analytics` | POST | Track usage event | `auth()` (optional, anon allowed) | READY | Accepts unauthenticated calls; mobile can use it for pre-login analytics. |
| `/api/contact` | POST | Public contact form (Resend email) | Rate-limited | WEB-ONLY | Web form. Mobile uses native mail composer or `/api/feedback`. |
| `/api/feedback` | POST | Beta-tester feedback widget (awards 25W) | `auth()` | READY | Repurpose for mobile in-app feedback. Drop the "beta" framing once out of TestFlight. |
| `/api/health` | GET | Service health check (DB, auth, email) | Public | READY | Useful for mobile App Store reviewer + status page. |

---

## 3. Net-new endpoints

Specs grouped by domain. All success responses are `200` unless stated; all error envelopes are `{ error: string, code?: string }`.

### Auth (mobile-specific NextAuth replacement)

The mobile client cannot use the NextAuth cookie-based session. Instead, mobile mints its own `accessToken` (1-hour JWT signed with our HS256 secret, `sub = users.id`) and `refreshToken` (90-day rotating opaque token, stored in `refresh_tokens` table, keyed by `deviceId`).

```
POST /api/auth/mobile/apple

Auth: none (this endpoint creates the session)

Request:
{
  identityToken: string,    // Apple-issued JWT from SiwA
  fullName?: { givenName?: string, familyName?: string }, // Only on first sign-in
  nonce: string,            // Echoed back from Apple for replay protection
  deviceId: string,         // UUID, persisted client-side, for refresh-token tracking
  referralCode?: string     // If set during signup; calls /api/referral internally
}

Response (200):
{
  accessToken: string,      // 1h JWT, "Authorization: Bearer <token>"
  refreshToken: string,     // 90-day rotating opaque token
  user: {
    id: string,
    email: string | null,   // null if user used Hide-My-Email and we couldn't get real email
    username: string | null,
    name: string,
    subscriptionStatus: string,
    profileComplete: boolean
  },
  isNewUser: boolean,
  needsProfileCompletion: boolean,  // username/city/state/DOB not yet set
  needsAccountLink: boolean         // Email matches existing non-Apple account; UI prompts to link
}

Errors:
- 400 INVALID_NONCE — nonce missing or mismatched
- 401 INVALID_TOKEN — Apple token signature/expiry verification failed
- 409 EMAIL_CONFLICT — Existing account with same real email, needs link flow (returns existing user's id stub for the link UI)
```

```
POST /api/auth/mobile/google

Auth: none

Request:
{
  idToken: string,          // Google-issued ID token from native sign-in
  deviceId: string,
  referralCode?: string
}

Response (200): same shape as Apple endpoint above.

Notes:
- Verify against the mobile-specific Google OAuth client ID (separate from web client).
- Re-uses the existing OAuth-signin user creation path from auth.ts L72–115.

Errors:
- 401 INVALID_TOKEN
- 409 EMAIL_CONFLICT
```

```
POST /api/auth/mobile/email

Auth: none

Request:
{
  email: string,
  password: string,
  deviceId: string
}

Response (200): same shape as Apple endpoint above.

Notes:
- Wraps the same bcrypt-compare logic from auth.ts L22–62.
- Rate-limit: 5 attempts per 15min per IP+email pair (reuse @/lib/rate-limit).
- If email exists but no passwordHash (OAuth-only user), return 409 NO_PASSWORD_SET — UI prompts SiwA/Google.

Errors:
- 401 INVALID_CREDENTIALS
- 403 EMAIL_NOT_VERIFIED
- 409 NO_PASSWORD_SET
- 429 RATE_LIMITED
```

```
POST /api/auth/mobile/refresh

Auth: refresh token in body

Request:
{
  refreshToken: string,
  deviceId: string
}

Response (200):
{
  accessToken: string,      // new 1h JWT
  refreshToken: string,     // new rotating token; client must replace old one
  expiresIn: number         // seconds, ~3600
}

Notes:
- Refresh tokens rotate on every use (defense in depth). Old token marked revoked.
- Reusing a revoked refresh token revokes the whole device session (security signal).
- Sliding 90-day TTL: each successful refresh extends the expiry.

Errors:
- 401 INVALID_REFRESH_TOKEN
- 401 REVOKED — possible token theft; client should sign out
```

```
POST /api/auth/mobile/logout

Auth: refresh token in body (no access token needed — works even after expiry)

Request:
{
  refreshToken: string,
  deviceId: string
}

Response (200): { success: true }

Notes:
- Idempotent. Marks the refresh token revoked. Doesn't touch other devices.
- Client should also unregister Expo push token via DELETE /api/push-tokens/[token].
```

### Account (deletion / linking / export)

```
POST /api/account/link

Auth: access token (current user)

Request:
{
  provider: "apple" | "google" | "email",
  identityToken?: string,   // For apple/google
  email?: string,           // For email-link path
  verificationCode?: string // 6-digit OTP sent to email
}

Response (200):
{
  success: true,
  linkedProviders: string[]   // updated list, e.g. ["email", "apple"]
}

Notes:
- Two-step flow:
  1. Client POSTs `{provider: "email", email}` → server emails OTP, returns `{pending: true}`.
  2. Client POSTs `{provider: "email", email, verificationCode}` → verifies and links.
- For SiwA/Google: verify the provided identityToken, ensure no other account already owns it, then add to `linked_providers` table.

Errors:
- 409 ALREADY_LINKED
- 409 PROVIDER_BELONGS_TO_OTHER_ACCOUNT — needs merge UI (not in v1 scope; reject with helpful message)
- 401 INVALID_CODE
```

```
DELETE /api/account

Auth: access token

Request: (no body)

Response (200):
{
  success: true,
  deletedAt: string,         // ISO timestamp
  restoreUntil: string,      // ISO timestamp = deletedAt + 30 days
  subscriptionAction: "none" | "stripe_canceled" | "apple_pending"
                              // Apple subs can't be canceled programmatically;
                              // client must show user the manage-subscriptions deep link
}

Notes:
- Sets users.deletedAt = now (new column).
- All authenticated endpoints must filter `WHERE deletedAt IS NULL` after this migration.
  Audit needed — see Section 4 prep checklist.
- Cancels Stripe subscription via API call.
- Revokes ALL refresh tokens for this user.
- Background job (Vercel Cron, daily) hard-deletes users where deletedAt < now - 30 days.

Errors:
- 401 — auth failure
- 409 ALREADY_DELETED
```

```
POST /api/account/restore

Auth: access token (returned by signing in within the grace window)

Request: (no body)

Response (200):
{
  success: true,
  restoredAt: string
}

Notes:
- Clears users.deletedAt.
- The mobile auth endpoints (apple/google/email above) should detect a deleted-but-within-grace user
  and return a 200 with a special flag `{ accountDeleted: true, restoreUntil }` — UI then offers
  restore.
```

```
GET /api/account/export

Auth: access token

Response (200): JSON dump (user record, all progress, watts ledger, bookmarks, SRS, sessions).

Notes:
- Apple privacy expectations: nice-to-have, not strictly required by 5.1.1(v). Recommend v1.1.
- Rate-limit hard: 1 export per 24 hours per user.
- Response is large (~MB for active users); stream as `application/json` with `Content-Disposition: attachment`.
```

### Subscriptions (RevenueCat-fronted IAP)

**Architecture decision (recommended):** RevenueCat is the source of truth for **purchase events**. Our backend mirrors the unified entitlement onto `users.subscriptionStatus` + `users.subscriptionSource` (new column: `"stripe" | "apple" | "trial"`) + `users.subscriptionPeriodEnd`. This keeps the existing many web routes that read `users.subscriptionStatus` working unchanged.

```
POST /api/webhooks/apple

Auth: Apple S2S signature (JWS) verification

Request: Apple ASN payload (we'll use the JSON Web Signature payload format introduced in iOS 14).

Response: 200 OK (Apple expects 200 on success, will retry up to 3 days on non-2xx).

Notes:
- Mirror logic from /api/webhooks/stripe but for Apple notification types:
  - INITIAL_BUY → set subscriptionStatus = "active", source = "apple"
  - DID_RENEW → update period end
  - DID_FAIL_TO_RENEW → past_due
  - REFUND / REVOKE → expired
  - SUBSCRIBED (with transactionType=PROMOTIONAL_OFFER) → handle promo
- Look up user by Apple `originalTransactionId` stored in users.appleOriginalTxId (new column).
- First INITIAL_BUY: backend will receive the notification BEFORE the mobile client confirms; the
  mobile client must include a server-receipt-validation roundtrip during purchase that links
  originalTxId → userId.
```

```
POST /api/subscriptions/sync

Auth: access token

Request:
{
  revenueCatUserId: string  // RC's app_user_id, which we set = users.id at SDK init
}

Response (200):
{
  status: "active" | "trialing" | "past_due" | "canceled" | "expired",
  source: "stripe" | "apple" | "trial",
  periodEnd: string | null,
  entitlements: string[]    // e.g. ["pro"]
}

Notes:
- Server-side: calls RevenueCat's REST API with shared secret, gets `customerInfo`,
  reconciles with users table. Used after a purchase, on app foreground, and after
  restorePurchases().
- This is the "fix discrepancies" hatch — if Apple webhook didn't fire, this call cleans up.
```

### Content (question pack distribution)

```
GET /api/question-packs

Auth: access token (gate Master tier behind subscription)

Response (200):
{
  packs: [
    {
      tier: "apprentice" | "journeyman" | "master",
      version: "2026.1.0",   // semver, increments on content updates
      etag: string,          // server-computed hash
      sizeBytes: number,
      questionCount: number,
      url: string,           // signed CDN URL to .json.gz, expires in 1h
      requiresSubscription: boolean
    }
  ]
}

Notes:
- Apprentice/Journeyman are bundled in the .ipa for offline-from-day-one (per plan §B-8).
  Client only fetches these when the bundled version is stale.
- Master tier: fetched on first use, cached locally. Requires active subscription.
- Versioning: bump version when content team updates a tier. Client compares vs local;
  if remote > local, downloads and replaces.
```

```
GET /api/question-packs/[tier]

Auth: access token (subscription gate for "master")

Headers:
- If-None-Match: <etag>   // Client sends previous etag

Response (200) or (304 Not Modified):
- 200: gzipped JSON of all questions in the tier. ETag header set.
- 304: empty body, client uses cached version.

Notes:
- Recommend serving from Vercel Edge with `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.
- Could also redirect to a signed S3/R2/Vercel-Blob URL — defer the storage call until we know
  the pack size.
```

### Sync (offline-first reconciliation)

**Protocol design:** delta-based, per-table cursor. Client tracks a `lastSyncedAt` per logical table (`progress`, `srs`, `bookmarks`, `flashcard_bookmarks`, `watts_ledger`, `sessions`). Upload pushes a batch of events with client UUIDs and timestamps; server idempotently merges. Download pulls everything that changed server-side since the cursor.

**Conflict policy:**
- **Watts ledger:** append-only on both sides. Server is authoritative on balance — client recomputes balance from ledger after sync.
- **SRS state:** last-write-wins by `lastReviewDate`. Client SRS calc and server SRS calc are deterministic; conflicts are rare.
- **Bookmarks:** union (additive). Deletes are tombstoned with `deletedAt` for sync purposes.
- **Sessions / quiz results:** client-wins for in-flight; server-wins after `endedAt` set.
- **Circuit breaker:** server-wins always (cooldown timestamps are server-authoritative).

```
POST /api/sync/upload

Auth: access token

Request:
{
  deviceId: string,
  batchId: string,         // client UUID for idempotency
  events: [
    {
      type: "progress" | "session_start" | "session_end" | "bookmark_add" | "bookmark_remove" |
            "flashcard_bookmark_add" | "flashcard_bookmark_remove" | "quiz_result" |
            "srs_update",
      clientId: string,    // client UUID of the affected entity (for dedupe on retry)
      timestamp: string,   // ISO, client-side wall clock; server may correct
      payload: object      // shape depends on type — mirrors the matching single-event endpoint body
    }
  ]
}

Response (200):
{
  processed: number,        // count
  rejected: [               // events server refused (e.g., past trial window, bad shape)
    { clientId: string, reason: string }
  ],
  serverState: {            // recomputed canonical values client should adopt
    wattsBalance: number,
    wattsLifetime: number,
    voltageTier: number,
    studyStreak: number,
    classification: string
  },
  syncedAt: string          // server time; client uses as next "since" cursor
}

Notes:
- Idempotent on (deviceId, batchId, clientId). Re-sending the same batch returns the same result.
- Cap batch size: 500 events. Larger → client splits.
- Watts deltas are computed server-side from authoritative event types (quiz_complete,
  review_complete, weak_spots_complete, daily_challenge_complete) using the existing
  calculateWattsServerSide() function — client-supplied watts amounts are IGNORED to prevent
  cheating.
```

```
GET /api/sync/state?since=<ISO timestamp>

Auth: access token

Response (200):
{
  user: { ... },            // canonical /api/user shape
  progress: [...],          // userProgress rows changed since `since`
  srs: [...],               // questionSrs rows changed since `since`
  bookmarks: [...],
  flashcardBookmarks: [...],
  sessions: [...],
  quizResults: [...],
  wattsTransactions: [...], // ledger entries created since `since`
  circuitBreakers: [...],
  syncedAt: string,
  deletedIds: {              // tombstones for things deleted server-side
    bookmarks: string[],
    flashcardBookmarks: string[]
  }
}

Notes:
- Cap total payload — if since is too old (>30 days), client must do a full refresh
  with since=null. Server returns 409 STALE_CURSOR with `recommendation: "full_refresh"`.
- Client merges into local SQLite; SRS and progress are last-write-wins by timestamp.
- This endpoint is heavy. Consider rate-limit: 1 per minute per device.
```

### Push notifications

```
POST /api/push-tokens

Auth: access token

Request:
{
  token: string,            // Expo push token
  deviceId: string,         // ties to refresh-token's deviceId
  platform: "ios"           // android future
}

Response (200):
{
  success: true,
  tokenId: string
}

Notes:
- New table `push_tokens` (id, userId, token, deviceId, platform, createdAt, lastUsedAt).
- Upsert by (userId, deviceId): replaces previous token for that device (Expo rotates tokens).
```

```
DELETE /api/push-tokens/[token]

Auth: access token

Response (200): { success: true }

Notes:
- Called on logout. Idempotent.
- Also called when Expo's push service tells us a token is unregistered (separate webhook
  flow — out of v1 scope; for v1, just clean up on 410 responses from Expo's send API).
```

```
PUT /api/user/notification-prefs

Auth: access token

Request:
{
  dailyStreakReminder: { enabled: boolean, hour: number /* 0-23 local */, minute: number },
  weeklyDigest: { enabled: boolean }
}

Response (200): { success: true, prefs: { ... } }

Notes:
- Stored on users row as a JSON column `notificationPrefs` (new column), default to:
  { dailyStreakReminder: { enabled: true, hour: 19, minute: 0 }, weeklyDigest: { enabled: true } }
- Server-side cron (Vercel Cron, every 15 min) reads users with timezone + prefs and queues
  Expo push sends through expo-server-sdk.
```

```
PUT /api/user/timezone

Auth: access token

Request:
{
  timezone: string  // IANA, e.g. "America/Denver"
}

Response (200): { success: true }

Notes:
- Could be folded into PATCH /api/profile, but separated here for clarity and so the mobile
  app can set it cheaply on every cold start (cheap to no-op if unchanged).
- Server uses this to compute the user-local "7pm" for streak reminders and "Sunday morning"
  for digests.
- Validate IANA name against Intl.supportedValuesOf("timeZone").
```

---

## 4. Backend prep checklist

Concrete tasks before mobile sprint 1 starts. Roughly day-estimated alongside.

**Schema migrations (Drizzle):**
- [ ] Add `users.deletedAt timestamp` (nullable). Soft-delete column. ~0.25d.
- [ ] Add `users.timezone text` (IANA name, nullable). ~0.25d (migration + default-set from web sessions).
- [ ] Add `users.subscriptionSource text` with enum check (`"stripe" | "apple" | "trial"`). ~0.25d.
- [ ] Add `users.appleOriginalTxId text` (nullable, unique). ~0.25d.
- [ ] Add `users.notificationPrefs text` (JSON-encoded; default `{}`). ~0.25d.
- [ ] Create table `refresh_tokens` (id, userId, deviceId, tokenHash, createdAt, expiresAt, revokedAt, lastUsedAt). Index on `(userId, deviceId)` and `(tokenHash)`. ~0.5d.
- [ ] Create table `push_tokens` (id, userId, token, deviceId, platform, createdAt, lastUsedAt). Index on `userId`. ~0.25d.
- [ ] Create table `linked_providers` (id, userId, provider, providerSubject, linkedAt). Unique on `(provider, providerSubject)`. ~0.25d.
- [ ] Create table `sync_event_log` (deviceId, batchId, clientId, processedAt) for idempotency. TTL ~30 days. ~0.5d.
- [ ] Create table `link_codes` (email, providerSubject, provider, codeHash, expiresAt, consumedAt). 10-min TTL. For OQ#5 Hide-My-Email linking flow. ~0.25d.
- [ ] Add `feedback.moderationStatus text` (default `'pending'`) and `feedback.rewardedAt timestamp` (nullable). For OQ#9 anti-spam gating. ~0.25d.

**Soft-delete audit:**
- [ ] Add `WHERE users.deletedAt IS NULL` to every query that reads `users` by id (estimate ~20 files in `app/api/` and `lib/`). Wrap auth() to short-circuit on deleted user. ~1d.

**Mobile auth shim:**
- [ ] Build `verifyAccessToken(token)` helper in `lib/auth-mobile.ts`: parses JWT, validates, returns `Session`-shaped object. ~0.5d.
- [ ] Build a thin `auth()` wrapper that checks for `Authorization: Bearer ...` header first, falls back to NextAuth cookie. This makes all existing routes transparently support both. ~0.5d.
- [ ] Implement the 5 `/api/auth/mobile/*` endpoints. ~3d (Apple SiwA token verification, Google ID token verification, bcrypt for email, refresh-token rotation logic).

**Subscription unification:**
- [ ] Decide: RevenueCat-as-source-of-truth vs own table. Recommend RC + mirror. (See open question #1.) ~0.5d for decision doc.
- [ ] Implement `/api/webhooks/apple` (JWS verification, ASN payload parsing, mirror to users table). ~2d.
- [ ] Implement `/api/subscriptions/sync` (RC API call, reconcile). ~1d.

**Account lifecycle:**
- [ ] `/api/account/link` — both OAuth-flavored and email-OTP flavored. ~1.5d.
- [ ] `/api/auth/mobile/link-request` + `/api/auth/mobile/link-confirm` (unauthenticated, for Hide-My-Email pre-auth linking). +1d (OQ#5 resolution).
- [ ] `/api/account` DELETE. ~1d.
- [ ] `/api/account/restore`. ~0.5d.
- [ ] Vercel Cron job: daily hard-delete sweep for `deletedAt < now-30d`. ~0.5d.
- [ ] ~~`/api/account/export`~~ — DEFERRED to v1.1 (OQ#8 resolution). −1d.

**Content delivery:**
- [ ] `/api/question-packs` + `/api/question-packs/[tier]` with ETag/304 handling. ~1d. (Defer signed-URL CDN delivery; serve direct from Vercel for v1.)

**Offline sync:**
- [ ] Server-side merge handlers for each event type. Reuse existing single-question logic in `/api/progress` for the `progress` event. ~3d.
- [ ] `/api/sync/upload`. ~2d.
- [ ] `/api/sync/state`. ~1.5d.

**Push notifications:**
- [ ] `/api/push-tokens` POST/DELETE. ~0.5d.
- [ ] `/api/user/notification-prefs` PUT. ~0.25d.
- [ ] `/api/user/timezone` PUT (or fold into PATCH /api/profile). ~0.25d.
- [ ] Vercel Cron job: every 15 min, send streak reminders for users where local clock = their `dailyStreakReminder.hour` and daily challenge incomplete. ~1.5d.
- [ ] Vercel Cron job: weekly Sunday digest aggregator. ~1d.
- [ ] expo-server-sdk integration. ~0.5d.

**Polish & tooling:**
- [ ] Add `idempotencyKey` support to `/api/sessions` POST/PATCH and `/api/review/*/complete`. ~0.5d.
- [ ] Add `?slim=1` to bookmark routes. ~0.25d.
- [ ] Pagination on `/api/watts/transactions`. ~0.25d.
- [ ] Standardize error envelopes (`{ error, code }`) across all routes for predictable mobile error handling. ~1d.

**Feedback anti-spam (OQ#9 resolution):**
- [ ] Add per-user rate limit on `POST /api/feedback` (1 reward-eligible submission per 24h). ~0.25d.
- [ ] Enforce minimum length (~50 chars) and reject empty/whitespace-only submissions. ~0.1d.
- [ ] Add manual-moderation queue UI (basic admin page listing pending feedback). ~0.5d.
- [ ] Gate Watts payout: award only when `moderationStatus = 'approved'`. ~0.15d.
- Total OQ#9 add-on: ~0.5d (rolled up).

---

## 5. Open questions ✅ ALL RESOLVED 2026-05-20

1. **RevenueCat as source of truth, or own entitlement store?**
   - **Resolved:** RC as source of truth, mirror to `users`. Less custom plumbing; RC handles grace periods, billing retries, and refund reconciliation. Accept the vendor dependency given the maintenance savings.
   - _Implementation:_ Apple S2S Notifications → RC; Stripe webhook calls RC REST API to upsert web-purchased entitlements; our `/api/webhooks/revenuecat` (new — replaces standalone Apple webhook) mirrors `subscription_status` and `subscription_source` onto the `users` row for fast reads.

2. **Refresh token rotation policy — strict or lenient?**
   - **Resolved:** Strict rotation with 30-second grace overlap.
   - _Implementation:_ `refresh_tokens` table tracks `(tokenHash, rotatedToHash, rotatedAt)`. On refresh, mark old token rotated and accept it for exactly 30s after rotation (handles legitimate retry races). Any use of a token after the grace window revokes all refresh tokens for that `deviceId` and returns 401 — treated as theft signal. Client must re-authenticate.

3. **Sync conflict for SRS — last-write-wins by timestamp, or always server-recomputes?**
   - **Resolved:** Last-write-wins by client `answeredAt` timestamp. SM-2 is deterministic; the edge case (same question answered simultaneously on two devices while offline) is rare for an exam-prep audience that typically uses one device at a time.

4. **Resistance penalties + offline:** if a user is offline for 5 days, what happens?
   - **Resolved:** Server-side cron at user's 3am local time. Cron sweeps users whose `timezone`-local time crosses 3am, applies any due penalties, updates the row. Client just reads current values on foreground.
   - _Dependency:_ `users.timezone` column (already in the schema-migration list).

5. **Hide-My-Email + linking UX endpoint design:**
   - **Resolved:** Add `/api/auth/mobile/link-request` + `/api/auth/mobile/link-confirm` in v1 (+1 day). Without these, SiwA-relay users hit a "where's my web account?" wall.
   - _Spec:_
     - `POST /api/auth/mobile/link-request` (unauthenticated) — body: `{ email, providerSubject, provider }`. Sends a 6-digit code to `email`. Stores `(email, providerSubject, codeHash, expiresAt)` in a new `link_codes` table (10-min TTL).
     - `POST /api/auth/mobile/link-confirm` (unauthenticated) — body: `{ email, code, providerSubject }`. Verifies, links the provider to the existing user, returns access + refresh tokens.

6. **Question pack distribution:** serve gzipped JSON from Vercel directly, or signed URLs to a CDN?
   - **Resolved:** Direct serve from Vercel for v1. With ETag/304, most fetches are 304s. Revisit if/when traffic justifies the CDN move.

7. **Streak reminder cron granularity:**
   - **Resolved:** Every-15-minute cron + UI time picker restricted to 15-min increments. Hides the imprecision; keeps Vercel Cron invocation count within free-tier budget.

8. **Account export — v1 or v1.1?**
   - **Resolved:** Defer to v1.1. Not required by Apple 5.1.1(v). Manual support-request path acceptable for GDPR until volume justifies. Saves ~1 day.

9. **`/api/feedback` Watts reward post-launch?**
   - **Resolved (deviated from recommendation):** Keep awarding Watts at public launch. ⚠️ **Mitigation required:** rate-limit feedback submissions per user (e.g., 1 reward-eligible submission per 24h), add length minimum (50 chars), add a `moderation_status` column to `feedback` table with default `pending`, and gate the Watts payout on moderation approval (manual queue for first 6 months, can build a heuristic later). **Adds ~0.5d** to backend scope.
   - _Open follow-up:_ Decide whether to flag clearly-AI-generated feedback automatically and quarantine it. Likely v1.1 or later — manual moderation suffices at v1 scale.

---

## 5.5 Net audit changes after resolution

| Change | Day delta |
|---|---|
| OQ#5: Add 2 unauthenticated linking endpoints (`link-request` + `link-confirm`) + `link_codes` table | **+1.0d** |
| OQ#8: Defer account export | **−1.0d** |
| OQ#9: Add rate-limit + moderation + Watts gating for `/api/feedback` | **+0.5d** |
| **Net** | **+0.5d** |

Total backend estimate revised: **~35.5 working days** (effectively unchanged from original ~35).

---

## 6. Backend effort estimate

Rolling up Section 4:

| Bucket | Days |
|---|---|
| Schema migrations + soft-delete audit | ~3.5 |
| Mobile auth shim + 5 endpoints | ~4 |
| Subscription unification (Apple webhook + sync) | ~3.5 |
| Account lifecycle (link/delete/restore/cron) | ~3.5 |
| Content delivery (question packs) | ~1 |
| Offline sync (upload/state + merge handlers) | ~6.5 |
| Push notifications (endpoints + crons + Expo SDK) | ~4 |
| Polish (idempotency, pagination, error envelopes) | ~2 |
| **Subtotal** | **~28 days** |
| Buffer for first-time-on-this-stack tax (Apple JWS verification, RC API quirks, Expo SDK gotchas — see plan §F bullet 2) | +7 days |
| **Total before mobile sprint 1 can start** | **~35 working days, ~7 weeks solo** |

**Realism check:** ~28 raw days × 1.25 = 35. That tracks with the plan's "4–6 months to TestFlight" overall — backend is the first ~30% of the effort budget. Solo cadence means realistic calendar is ~8-9 weeks.

**Critical path** (things that block mobile sprint 1, vs nice-to-have):
- **Hard blockers** (must be done first): schema migrations, mobile auth shim + endpoints, push-token registration, timezone column. **~7 days.**
- **Soft blockers** (block specific features but not the first sprint): sync endpoints, Apple webhook, question packs, account deletion. Can develop these in parallel with mobile sprint 1 if mobile sprint 1 focuses on auth + dashboard + online-only quiz. **~21 days.**

**Recommended sequencing:**
1. Week 1: schema migrations + soft-delete audit + mobile auth shim. Unblock first mobile sprint.
2. Weeks 2–4: sync protocol + Apple IAP/webhook + account lifecycle.
3. Weeks 5–7: push + question packs + polish.
4. Mobile sprint 1 starts at end of week 1, parallelized.
