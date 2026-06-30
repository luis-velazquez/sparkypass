# SparkyPass — Analytics & Feature-Flag Instrumentation Plan (web-side, mobile-ready)

**Status:** Scoped 2026-06-09 (code-grounded). Not yet implemented.
**Pairs with:** [mobile-conversion-plan.md](./mobile-conversion-plan.md) §E-24a (analytics + flags → Sprint 1), [mobile-build-todo.md](./mobile-build-todo.md).
**Why now:** The mobile audit found there is **no product analytics and no feature-flag/A-B infra**, and the existing `analytics_events` table lacks platform/version/session/funnel fields — so the 3–6 month TestFlight beta would be unmeasurable. This builds the **web-side** spine now so it's ready before the RN app is scaffolded and so web + mobile share one schema, one catalog, one client contract.

---

## 1. Recommendation (the stack)

**Hardened first-party `analytics_events` stream (Turso) as the source-of-truth spine + PostHog EU Cloud layered on top for funnel/cohort math and feature flags.** Both are fed from one shared `EVENT_CATALOG` so the taxonomy can't drift across platforms.

**Strict division of responsibility:**
- **First-party (Turso) is source of truth** for anything money/Watts/streak — Stripe + RevenueCat webhooks, `/api/sessions`, referrals. This data **never leaves Turso**.
- **PostHog only sees pseudonymous behavioral events** (activation/monetization/retention funnels, cohorts, web session replay, **all** feature flags). It is never trusted for billing.
- **The bridge:** one shared server `trackEvent()` helper writes the first-party row **and** mirrors a `posthog.capture()` with the same `userId`/`anonId` at the exact DB-mutation truth points — so funnels derive from the same event that wrote the truth, not a flaky client beacon.

**Rejected:** first-party-only (would force hand-rolling funnel math + cohorts + a flag system in SQL — the exact work this task exists to avoid); Amplitude/Mixpanel (flags are a separate paid tool, doubling integration + privacy surface); PostHog self-host (ClickHouse+Kafka+Redis ops is indefensible for a solo dev on managed Turso). Today only `@sentry/nextjs` is installed (diagnostics-only; it stays that way).

**Mobile inherits everything** by implementing one ~6-method platform adapter — no schema, catalog, or ingestion-contract changes.

---

## 2. Current-state gaps (verified against source)

- **Schema** (`lib/db/schema.ts:297-304`): only `id, user_id, event, page, metadata(JSON), created_at` — no platform / app_version / session_id / anon_id / event_id / client_ts / funnel / step. Web and mobile would be indistinguishable; pre-signup activation can't be stitched to the created user.
- **Effective coverage is ONE event:** `page_view` auto-fires on route change (`hooks/useAnalytics.ts:40-45`). `grep '.track('` → **zero** call sites; the hook's `track()` is never called. `trackEvent()` has exactly one caller — the ingestion route itself.
- **Three divergent event lists** that disagree (`app/api/analytics/route.ts:5-13` 7-event allowlist vs `lib/analytics.ts:4-13` vs `hooks/useAnalytics.ts:6-13` + a stale schema comment). None funnel-aware.
- **Every funnel surface is un-instrumented** (grep-verified): onboarding, trial header/banner, `/api/sessions`, `/api/referral`, `/api/review/complete`, both webhooks, register/auth — all emit zero events.
- **Ingestion** is single-event POST only, no batch, no idempotency, no payload cap, and **swallows all errors returning `200 {ok:true}`** (`route.ts:33-34`) → write failures are invisible. Unusable for an offline mobile retry queue.
- **No read path** of any kind (no `.select`, no aggregation, no dashboard) and **no indexes** at beta scale.
- **No feature-flag / A-B / remote-config infra anywhere** → a TestFlight retention change couldn't be rolled back without an App Store release.
- **Trial-length bug (confirmed):** register grants a **30-day** trial (`app/api/register/route.ts:106`) but `TrialStatusHeader.tsx:20` hardcodes `totalDays=7`. The server emit must carry the real length, and the UI constant should be fixed.
- **Reusable patterns already in the repo:** `sync_event_log` enforces `(deviceId,batchId,clientId)` uniqueness (`schema.ts:401-419`) — the idempotency model to mirror. Idempotent early-return branches exist in `/api/sessions` (POST `49-55`, PATCH `127-140`) — **funnel emits must sit on the non-idempotent branch only**, or offline retries double-count.

---

## 3. Schema migration — `0021_analytics_events_v2`

All adds are nullable or constant-default → SQLite `ALTER TABLE ADD COLUMN` is metadata-only (no rewrite); existing rows survive. Next number is 0021 (latest on disk is `0020_feedback_table.sql`).

| Column | Type | Purpose |
|---|---|---|
| `event_id` | TEXT | Client UUID v4; idempotency key for at-least-once offline delivery. **Backfill legacy rows with `id`** so a full-unique index holds. |
| `anon_id` | TEXT | Persistent pre-auth device id; survives the signup boundary so `app_open`/`signup_started` join to the created `user_id`. Mobile reuses the `device_id` from `refresh_tokens`/`push_tokens`. |
| `session_id` | TEXT | Analytics session (rotates on foreground / 30-min idle); **distinct from `studySessions.id`**. Enables day0/day1/day7 retention. |
| `platform` | TEXT NOT NULL DEFAULT `'web'` | web\|ios\|android; existing rows default to web. |
| `app_version` | TEXT | Build hash / iOS bundle version → slice beta regressions by build. |
| `os_version` | TEXT | iOS version / UA-derived browser. |
| `device_model` | TEXT | `iPhone15,2` etc.; null on web. |
| `funnel` | TEXT | activation\|monetization\|retention — **server-derived from `EVENT_CATALOG` at ingest, never client-set.** |
| `step` | TEXT | Funnel step label; server-derived; enables `GROUP BY` without JSON extraction. |
| `properties` | TEXT | Typed per-event JSON (new writes). Keep legacy `metadata`; reads `COALESCE(properties, metadata)`. |
| `client_ts` | INTEGER | Unix-ms on-device event time so offline/batched events keep true ordering. |

**Indexes:** `UNIQUE(event_id)` (after backfill); `(event, created_at)`; `(user_id, created_at)`; `(anon_id, created_at)`; `(session_id, created_at)`; `(funnel, step, created_at)`.

**Notes:** keep `created_at` as server-receive time (don't add `ingested_at`). One-time backfill `UPDATE analytics_events SET event_id = id WHERE event_id IS NULL;` **before** creating the unique index (Drizzle can't emit a partial `WHERE event_id IS NOT NULL` predicate — full-unique + backfill is the simplest correct path). Either hand-write the ALTERs + append the `_journal.json` entry, or edit `schema.ts:297-304` and `drizzle-kit generate`.

---

## 4. Event catalog

Single source of truth: **`lib/analytics-events.ts` (NEW)** — collapses the 3 divergent lists. `object_action` snake_case. **Server-side events** are authoritative (money/Watts/streak); **client-side** for UI funnels.

| Event | Funnel | Side | Fires where | Key properties |
|---|---|---|---|---|
| `app_open` | activation | client | `useAnalytics` first-mount; RN app launch | `is_first_open`, `utm_*`/`referral_code` |
| `signup_started` | activation | client | `register/page.tsx` submit (anon_id only) | `method`, `referral_code` |
| `signup_completed` | activation | server | `api/register` after insert (l.100) + OAuth callbacks | `method`, `anon_id` (stitch), `trial_length_days:30` |
| `onboarding_completed` | activation | client | `WelcomeOnboarding.tsx` onComplete (l.72)/onSkip (l.79) | `skipped` |
| `first_quiz_completed` | activation | server | `api/sessions` PATCH, first ended session | `session_type`, `accuracy` |
| `first_watts_earned` | activation | server | `api/sessions` PATCH, `previousBalance===0 && newBalance>0` | `watts_amount` |
| `paywall_viewed` | activation | client | `/pricing` + `TrialStatusHeader.tsx` (l.39) + `SubscriptionBanner` | `surface`, `days_left_in_trial`, `subscription_status` |
| `checkout_started` | monetization | server | Stripe checkout route; RN RevenueCat purchase-initiated | `plan`, `billing_provider`, `is_winback` |
| `trial_started` | monetization | server | `api/register:106` + Stripe webhook→trialing (l.122) | `source`, `trial_ends_at`, `trial_length_days` |
| `subscription_converted` | monetization | server | Stripe webhook (l.62/115) + RevenueCat INITIAL_PURCHASE/RENEWAL (l.64-66) | `plan`, `from_status`, `from_trial` |
| `subscription_lapsed` | monetization | server | Stripe webhook (l.153/127/175-190) + RevenueCat EXPIRATION (l.73) | `reason`, `was_trial` |
| `winback_converted` | monetization | server | reuses `subscription_converted` path w/ prior canceled/expired | `days_since_lapse` |
| `upgrade_cta_clicked` | monetization | client | `TrialStatusHeader.tsx:39` + `SubscriptionBanner` CTAs | `surface`, `days_left_in_trial` |
| `study_session_completed` | retention | server | `api/sessions` PATCH non-idempotent branch | `session_type`, `accuracy`, `watts_earned` |
| `daily_challenge_completed` | retention | server | `api/sessions` PATCH when `activityType==='daily_challenge'` | `watts_earned`, `perfect` |
| `streak_extended` | retention | server | `api/sessions` PATCH when streak ↑ (l.164-179) | `new_streak`, `is_milestone`, `used_streak_fuse` |
| `streak_at_risk` | retention | server | `api/cron/streak-reminder` per at-risk user | `current_streak`, `hours_until_break`, `streak_fuse_active` |
| `review_completed` | retention | server | `api/review/complete` POST non-idempotent branch | `questions_correct`, `weak_spots` |
| `referral_completed` | core | server | `api/referral` status→completed (l.48) | `referrer_id`, `watts_awarded` |
| `rank_advanced` | core | server | `api/sessions` PATCH when advancement truthy (l.244) | `from_classification`, `to_classification` |
| `feedback_submitted` | core | client | existing — keep | `category`, `route` |
| `flag_exposed` | core | client | client flag-eval wrapper (A-B exposure logging) | `flag_key`, `variant`, `source` |
| `page_view` | core | client | `useAnalytics` route change (existing) — keep, retire dead enum values | `path` |

**Standard properties on every event:** `event` (validated vs catalog), `event_id` (UUID idempotency), `user_id` (server-set, never trusted from client), `anon_id`, `session_id`, `platform`, `app_version`, `os_version`/`device_model`, `route`, `funnel`+`step` (server-derived), `client_ts`, `created_at` (server), `properties`.

---

## 5. Client library design (one contract, compiles unchanged in RN)

Isolate the 3 platform-specific concerns behind an `AnalyticsPlatform` adapter (~6 methods): `getItem/setItem` (web localStorage / RN MMKV), `send(batch)` (web `sendBeacon` on hide else `fetch keepalive` / RN `fetch`), `env()` (platform/version/device), `onLifecycle(cb)` (web visibilitychange+pagehide / RN AppState), `now()`.

`createAnalytics(platform)` core is **identical** on both: holds `queue[]`, `anonId` (hydrated/minted+persisted), `sessionId` (rotates on foreground or >30-min idle), `userId` (set by `identify()` after auth). Public surface: `track(event, props)` (validates vs `VALID_EVENTS`, enqueues `{eventId, event, props, clientTs}`, flush at `MAX_BATCH=50`); `identify(uid)`; `flush()` (POSTs `{anonId, sessionId, env, events[]}`; on failure keeps events — server dedupes by `event_id` so retries are safe); `init()` (hydrate, 15s flush interval, lifecycle subscribe). `MAX_QUEUE=1000` + persist-on-failed-flush so events survive app kill (mobile).

**anon→user stitching:** `app_open`/`signup_started` fire pre-auth with `anon_id`; `signup_completed` (server) carries **both** the new `user_id` **and** the client `anon_id` — that one joined row links visitor → created user.

**Server emits** (sessions PATCH, webhooks, register, referral) call the shared server `trackEvent()` directly (no HTTP) and mirror to `posthog.capture()`. **RN reuse = write `lib/analytics/native.ts` against the same interface; zero changes to the core.**

---

## 6. Feature flags (roll back in minutes, not an App Store release)

PostHog flags are the control plane (boolean / multivariate / %-rollout / cohort, free tier, same SDK). Wrapped in a 3-layer delivery path for offline + outage tolerance:

1. **Server-evaluated bootstrap** — a thin `/api/flags` route calls PostHog server-side at app/session start, evaluates all flags for the `userId`, returns a plain JSON map. Cacheable, residency-controlled, works even when the PostHog client SDK is ad-blocked.
2. **Client caches** the last-known map (localStorage / expo-secure-store) and evaluates against cache; cold offline launch reads cache.
3. **Every flag has a hardcoded SAFE DEFAULT** baked into the bundle (= shipped behavior) → a new install with no cache and no network still renders a defined experience; an unreachable flag service degrades to old behavior, never broken.

`lib/flags.ts` exposes `getFlag(key)` with the fallback chain (posthog → cache → bundled default) and emits `flag_exposed`. Ship every retention-sensitive change behind a flag from day one (streak-fuse rules, daily-challenge cadence, SRS interval tuning, paywall copy/timing). Roll-back = flip the flag; clients pick it up on next `/api/flags` refresh.

---

## 7. Privacy

- **Declare NO ATT prompt.** First-party PostHog (no IDFA, no ad SDK, no cross-app graph, no broker sharing) is **not** "tracking" under Apple's definition. Set App Privacy *Used to Track You = No* → avoids the ~15–25% opt-in funnel penalty. Guardrail: never enable any PostHog ad-network/attribution integration, never collect IDFA.
- **Keep identifiable/billing-grade data first-party only** — email, OAuth subject, Stripe/RevenueCat IAP history, free-text feedback, push tokens, Watts/streak balances **never** go to PostHog. Only pseudonymous behavioral events (with `userId`/`anonId`) do.
- **App Store "Data Collected":** add purpose *Analytics* to Identifiers (User ID + distinct_id, linked), Usage Data (funnel events, linked), Purchases (subscription state). Don't declare Location for the IANA `timezone` string.
- **PostHog EU Cloud** (`eu.posthog.com`) + DPA for residency.
- **Ingestion guards:** per-event property allowlist + 4 KB props cap + 64 KB body cap + rate-limit the public route (no PII leaks into the blob).
- **GDPR erasure parity:** the FK `onDelete:'set null'` (`schema.ts:299`) anonymizes deleted-user rows, but user-deletion must **also** trigger PostHog distinct-id deletion.
- **Mobile (deferred):** ship `PrivacyInfo.xcprivacy` (UserDefaults reason CA92.1, file-timestamp reasons) and **pin SDK versions that bundle signed privacy manifests** — App Store Connect rejects builds whose SDKs lack one (Sentry already ships one; verify `posthog-react-native` before submission).

---

## 8. Web ↔ mobile sharing

One schema, one catalog, one client contract, one ingestion endpoint:
1. **Schema:** same `analytics_events` table; `platform` column distinguishes web/ios/android; mobile reuses the existing `device_id` as `anon_id`.
2. **Catalog:** `lib/analytics-events.ts` is the single source of truth; RN imports it verbatim (extract into a shared package alongside the shipped `sparkypass-ui` when convenient). `funnel`/`step` server-derived → can't drift.
3. **Client:** `createAnalytics(platform)` core identical; mobile only writes `native.ts`.
4. **Ingestion:** same batch endpoint with `event_id` idempotency; offline retries dedupe via `onConflictDoNothing`.
5. **PostHog:** same project, same `userId` from both platforms → cohorts line up.
6. **Flags:** same `/api/flags` + bundled-defaults pattern.

---

## 9. Phased plan

| Phase | Scope | Effort |
|---|---|---|
| **1 — First-party spine (web)** | Migration 0021 (ALTER ×11 + backfill + indexes + journal); replace `schema.ts:297-304`; create `lib/analytics-events.ts` (catalog, retire dead enums); rewrite `api/analytics/route.ts` for batch + `event_id` idempotency + payload caps + server-derived funnel/step; extend server `trackEvent`. | ~2–3 d |
| **2 — RN-ready client lib (web)** | `platform.ts` interface + `client.ts` core (queue/batch/session/anon-id) + `web.ts` adapter + `native.ts` stub; rewrite `useAnalytics.ts` + `AnalyticsProvider` to delegate to singleton + add `identify()`. | ~2 d |
| **3 — Instrument the 3 funnels (web)** | Server emits in `sessions` PATCH non-idempotent branch (6 events); Stripe webhook (5); register/auth `signup_completed`+`trial_started` (real 30-day); `review_completed`; `referral_completed`; cron `streak_at_risk`; client `paywall_viewed`/`upgrade_cta_clicked`/`onboarding_completed`; **fix the trial-length mismatch**. | ~3 d |
| **4 — PostHog + flags + read path (web)** | Wire PostHog EU (posthog-js + posthog-node) into the server mirror; `lib/flags.ts` + `/api/flags` + `flag_exposed`; admin funnel SQL route + `/admin/analytics` page (gated by `ADMIN_USER_IDS`); privacy declarations. | ~2–3 d |
| **5 — Mobile inheritance** *(deferred to mobile sprint)* | `native.ts` (MMKV/expo, AppState, persisted offline queue); `posthog-react-native` + `PrivacyInfo.xcprivacy` + signed-manifest verification; RevenueCat monetization emits live; mobile flag cache. | deferred |

---

## 10. Open decisions

1. **Stack** — *PostHog EU Cloud + first-party spine (recommended)* vs first-party-only vs Amplitude/Mixpanel. → PostHog is the only option delivering **both** Sprint-1 deliverables (analytics + flags) from one SDK on a free tier the beta won't exhaust. First-party-only = hand-rolling funnels + cohorts + flags. Fallback: first-party-only + admin SQL + a tiny DB-backed flag table, accepting manual analysis and no %-rollout UI.
2. **Cloud vs self-host** → **Cloud (EU)**. Self-host (ClickHouse+Kafka+Redis) unjustified for a solo dev on managed Turso. The data split keeps a future swap low-risk.
3. **ATT prompt** → **No** (first-party posture; avoids the opt-in penalty).
4. **Partial vs full unique index on `event_id`** → **full-unique + backfill** (`event_id=id` for legacy NULLs) since Drizzle can't emit the partial predicate.
5. **Extract shared catalog into a package now or later** → **later**, when the mobile app is scaffolded (alongside `sparkypass-ui`); in-repo for this sprint.

---

## 11. Risks

- **Double-counting on offline retry:** funnel emits in `sessions`/`review/complete` **must** sit on the **non-idempotent branch only** (PATCH returns early at l.127-140, POST create at l.49-55). An emit before those guards inflates every retention metric on one mobile retry.
- **funnel/step drift:** derive them server-side from `EVENT_CATALOG` only — never let the client set them.
- **Money events must be webhook-driven:** `subscription_converted/lapsed/trial_started` are authoritative only from Stripe/RevenueCat webhooks off `users.subscriptionStatus` transitions — a client "I subscribed" event is unreliable (ad-block, ATT, flaky network).
- **Trial-length skew:** register grants 30 days but `TrialStatusHeader.tsx:20` hardcodes 7 — server emit must carry the real `trial_length_days`; fix the UI constant.
- **Always-200 masking:** the rewritten route still returns ok on error (never fail the client) — pair with a Sentry `captureMessage` on DB-insert failure so silent data loss is observable.
- **PostHog free-tier overage at launch:** sample/batch high-frequency events; money/streak stay first-party (zero PostHog cost).
- **GDPR erasure parity:** user deletion nulls `user_id` but must also trigger PostHog distinct-id deletion.
- **Mobile SDK privacy manifest:** verify/pin `posthog-react-native` ships a signed `PrivacyInfo.xcprivacy` before submission.
- **Migration journal sync:** hand-writing 0021 requires appending the correct `_journal.json` entry (or `drizzle-kit generate`) or drizzle-kit state desyncs.
