// POST /api/webhooks/revenuecat
//
// RevenueCat webhook. Per audit Section C-9 resolution: RC is the source of
// truth for entitlements; this endpoint mirrors the state into the `users` row
// so app code reads `users.subscriptionStatus` (fast, indexed) instead of
// calling RC's API on every request.
//
// Authentication: RC sends `Authorization: Bearer <secret>` where the secret
// is configured in the RC dashboard and stored here as REVENUECAT_WEBHOOK_SECRET.
//
// Idempotency: RC delivers at-least-once and unordered. subscriptionPeriodEnd
// only moves forward, 'active' requires a future-dated period, and demotions
// are skipped when a newer grant extends past the lapsing one — so replayed
// or out-of-order events cannot resurrect or clobber entitlement state.

import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db, users } from "@/lib/db";

type RCStore = "APP_STORE" | "PLAY_STORE" | "STRIPE" | "MAC_APP_STORE" | "PROMOTIONAL";

interface RCEvent {
  type: string;
  event_timestamp_ms: number;
  app_user_id: string;
  original_app_user_id?: string;
  product_id?: string;
  period_type?: "NORMAL" | "TRIAL" | "INTRO";
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  store?: RCStore;
  environment?: "SANDBOX" | "PRODUCTION";
  original_transaction_id?: string;
  transaction_id?: string;
  entitlement_ids?: string[];
  // TRANSFER events: the entitlement moved between app_user_ids (restore
  // purchases on another account). No top-level app_user_id is meaningful.
  transferred_from?: string[];
  transferred_to?: string[];
}

interface RCWebhookBody {
  api_version?: string;
  event?: RCEvent;
}

function mapStoreToSource(store: RCStore | undefined): "apple" | "trial" | null {
  switch (store) {
    case "APP_STORE":
    case "MAC_APP_STORE":
      return "apple";
    case "PROMOTIONAL":
      // RC dashboard comps. 'trial' keeps them out of Apple-manage UI.
      return "trial";
    case "STRIPE":
    case "PLAY_STORE":
      // Web billing is terminated and Android isn't v1 — never write these
      // sources; leave the row's source unchanged if such an event appears.
      return null;
    default:
      return null;
  }
}

// Maps the RC event type to the new subscription_status the users row should
// reflect. Returning null means "leave subscription_status as-is" (most
// observability/info-only events).
function mapEventToStatus(eventType: string): string | null {
  switch (eventType) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
      return "active";
    case "CANCELLATION":
      // User cancelled auto-renew but still has paid access until expiration.
      // Keep status "active"; transition to "expired" happens on EXPIRATION.
      return null;
    case "EXPIRATION":
      return "expired";
    case "BILLING_ISSUE":
      return "past_due";
    case "SUBSCRIPTION_PAUSED":
      return "canceled";  // closest existing enum value
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  const expectedAuth = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!expectedAuth) {
    console.error("[webhooks/revenuecat] REVENUECAT_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Server misconfigured", code: "INTERNAL" },
      { status: 500 },
    );
  }

  const presented = request.headers.get("authorization");
  if (presented !== `Bearer ${expectedAuth}`) {
    console.warn("[webhooks/revenuecat] Invalid Authorization header");
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let body: RCWebhookBody;
  try {
    body = (await request.json()) as RCWebhookBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const event = body.event;
  if (!event) {
    return NextResponse.json(
      { error: "Missing event payload", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  // Fail closed on environment: only PRODUCTION events (or an explicit
  // ALLOW_RC_SANDBOX=1 staging opt-in) may mutate entitlements. TestFlight,
  // App Review, and dev-device purchases arrive as SANDBOX — a sandbox
  // purchase must never grant real Pro, and sandbox subs expire in minutes,
  // which would clobber real paid state. Ack with 200 so RC doesn't retry.
  // Exception: TRANSFER events carry `environment` only sometimes (RC docs),
  // and dropping a production transfer would leave the losing account Pro
  // forever — so TRANSFER is blocked only when explicitly SANDBOX.
  const envBlocked =
    event.type === "TRANSFER"
      ? event.environment === "SANDBOX"
      : event.environment !== "PRODUCTION";
  if (envBlocked && process.env.ALLOW_RC_SANDBOX !== "1") {
    console.log("[webhooks/revenuecat] Ignoring", event.environment, "event:", event.type);
    return NextResponse.json({ ok: true, ignored: "sandbox" });
  }

  // Billing channels we don't sell through: web/Stripe billing is terminated
  // and Android isn't v1. Ignore the whole event (not just the source write) —
  // a STRIPE/PLAY_STORE lifecycle event must not touch status either.
  if (event.store === "STRIPE" || event.store === "PLAY_STORE") {
    console.log("[webhooks/revenuecat] Ignoring", event.store, "event:", event.type);
    return NextResponse.json({ ok: true, ignored: "store" });
  }

  // TRANSFER: the Apple receipt's history moved to a different app_user_id
  // (restore purchases while signed into another SparkyPass account). The
  // losing account must not keep Pro. The GAINING account only gets Pro when
  // the transfer carries evidence of a live subscription: RC fires TRANSFER
  // for lapsed receipts too (the EXPIRATION already ran against the old
  // account, so nothing would ever demote a blind grant). Evidence = a
  // recognized from-row that is currently active/past_due with a future
  // periodEnd (or the event's own future expiration_at_ms, when present).
  // With no evidence we skip the grant — the next RENEWAL, addressed to the
  // new app_user_id, activates it. Unrecognized ids (RC anonymous ids) match
  // no rows and are skipped naturally.
  if (event.type === "TRANSFER") {
    const from = (event.transferred_from ?? []).filter(Boolean);
    const to = (event.transferred_to ?? []).filter(Boolean);
    const now = Date.now();

    let evidencePeriodEnd: Date | null =
      typeof event.expiration_at_ms === "number" && event.expiration_at_ms > now
        ? new Date(event.expiration_at_ms)
        : null;
    if (from.length > 0) {
      const fromRows = await db
        .select({
          status: users.subscriptionStatus,
          periodEnd: users.subscriptionPeriodEnd,
        })
        .from(users)
        .where(inArray(users.id, from));
      for (const r of fromRows) {
        if (
          (r.status === "active" || r.status === "past_due") &&
          r.periodEnd &&
          r.periodEnd.getTime() > now &&
          (!evidencePeriodEnd || r.periodEnd.getTime() > evidencePeriodEnd.getTime())
        ) {
          evidencePeriodEnd = r.periodEnd;
        }
      }
    }
    // Demote + grant atomically: a crash between the two would destroy the
    // evidence (from-row already expired) and RC's retry would skip the
    // grant. batch() is libsql-only; local better-sqlite3 dev falls back to
    // sequential writes.
    const transferWrites = [];
    if (from.length > 0) {
      transferWrites.push(
        db
          .update(users)
          .set({
            subscriptionStatus: "expired",
            appleOriginalTxId: null,
            updatedAt: new Date(),
          })
          .where(inArray(users.id, from)),
      );
    }
    if (to.length > 0 && evidencePeriodEnd) {
      transferWrites.push(
        db
          .update(users)
          .set({
            subscriptionStatus: "active",
            subscriptionSource: mapStoreToSource(event.store) ?? "apple",
            subscriptionPeriodEnd: evidencePeriodEnd,
            updatedAt: new Date(),
          })
          .where(inArray(users.id, to)),
      );
    }
    if (transferWrites.length === 2 && typeof db.batch === "function") {
      await db.batch(transferWrites as [(typeof transferWrites)[0], (typeof transferWrites)[1]]);
    } else {
      for (const w of transferWrites) await w;
    }
    console.log(
      "[webhooks/revenuecat] TRANSFER from=", from, "to=", to,
      "granted=", !!evidencePeriodEnd,
    );
    return NextResponse.json({ ok: true });
  }

  // Only the `pro` entitlement gates anything in the app. For lifecycle
  // events that write status, REQUIRE the event to name `pro`: an event for a
  // different entitlement (future products) or an entitlement-unmapped
  // product (dashboard misconfig) must neither grant nor revoke Pro. Sandbox
  // testing before launch will surface a missing product→entitlement mapping.
  if (
    mapEventToStatus(event.type) !== null &&
    !(event.entitlement_ids ?? []).includes("pro")
  ) {
    console.log("[webhooks/revenuecat] Ignoring non-pro entitlement event:", event.type, event.entitlement_ids);
    return NextResponse.json({ ok: true, ignored: "other_entitlement" });
  }

  // app_user_id MUST match a real user — we set it via RC's `setAppUserId(user.id)`
  // on the mobile client. If it doesn't, this is either a misconfigured app or
  // an event for a user we don't recognize. Acknowledge with 200 so RC doesn't
  // retry indefinitely.
  const userId = event.app_user_id;
  if (!userId) {
    console.warn("[webhooks/revenuecat] Event without app_user_id:", event.type);
    return NextResponse.json({ ok: true, ignored: "no_app_user_id" });
  }

  const [user] = await db
    .select({ id: users.id, subscriptionPeriodEnd: users.subscriptionPeriodEnd })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    console.warn("[webhooks/revenuecat] No user for app_user_id:", userId);
    return NextResponse.json({ ok: true, ignored: "unknown_user" });
  }

  const newStatus = mapEventToStatus(event.type);
  const newSource = mapStoreToSource(event.store);
  const newPeriodEnd =
    typeof event.expiration_at_ms === "number"
      ? new Date(event.expiration_at_ms)
      : null;

  // Idempotency guardrail: if RC re-delivers a stale event, don't move
  // subscription_period_end backward.
  const setPeriodEnd =
    newPeriodEnd &&
    (!user.subscriptionPeriodEnd ||
      newPeriodEnd.getTime() >= user.subscriptionPeriodEnd.getTime());

  // Status guards (RC delivers at-least-once, unordered):
  // - 'active' requires a future-dated period. A replayed purchase event
  //   landing after the chain's EXPIRATION would otherwise resurrect Pro
  //   forever (no later event ever demotes it).
  // - Demotions (expired/past_due/canceled) are skipped when the stored
  //   periodEnd is LATER than the event's own expiration — that means a
  //   different grant/product already extended access beyond the thing that
  //   just lapsed (e.g. a promo grant expiring under an active Apple sub).
  // A guard-blocked event is stale or superseded — drop it ENTIRELY. Writing
  // its source/txid anyway would flip a paid row's source (promo lapse under
  // an Apple sub → 'trial', breaking the manage-in-App-Store affordance) or
  // let a stale replay steal appleOriginalTxId from its rightful row.
  if (
    newStatus === "active" &&
    (!newPeriodEnd || newPeriodEnd.getTime() <= Date.now())
  ) {
    console.log("[webhooks/revenuecat] Ignoring stale 'active' event:", event.type, event.expiration_at_ms);
    return NextResponse.json({ ok: true, ignored: "stale" });
  }
  if (
    (newStatus === "expired" || newStatus === "past_due" || newStatus === "canceled") &&
    newPeriodEnd &&
    user.subscriptionPeriodEnd &&
    user.subscriptionPeriodEnd.getTime() > newPeriodEnd.getTime()
  ) {
    console.log("[webhooks/revenuecat] Ignoring demotion — newer grant extends access:", event.type);
    return NextResponse.json({ ok: true, ignored: "superseded" });
  }

  // KNOWN residual (v1.1 follow-up: processed-event dedupe table): a replayed
  // purchase event whose expiration_at_ms is still in the future, landing
  // after a refund-driven EXPIRATION inside RC's ~2.5h retry window, would
  // re-activate the row. Dates alone cannot distinguish it from a legitimate
  // re-subscribe; only event-id dedupe can.

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (newStatus) updates.subscriptionStatus = newStatus;
  if (newSource) updates.subscriptionSource = newSource;
  if (setPeriodEnd) updates.subscriptionPeriodEnd = newPeriodEnd;
  if (event.store === "APP_STORE" && event.original_transaction_id) {
    updates.appleOriginalTxId = event.original_transaction_id;
  }

  // Only update if there's something to set.
  if (Object.keys(updates).length > 1) {
    // appleOriginalTxId is UNIQUE. If this receipt was previously attached to
    // a different account (restore onto a new account where a TRANSFER event
    // was missed or arrived out of order), release it there first. batch()
    // makes release+claim atomic; if a concurrent delivery still wins the
    // race, the 500 below is deliberate — RC's retry re-runs the pair.
    const claim = updates.appleOriginalTxId as string | undefined;
    const write = db.update(users).set(updates).where(eq(users.id, userId));
    if (claim) {
      const release = db
        .update(users)
        .set({ appleOriginalTxId: null, updatedAt: new Date() })
        .where(and(eq(users.appleOriginalTxId, claim), ne(users.id, userId)));
      // batch() is libsql-only; local better-sqlite3 dev falls back.
      if (typeof db.batch === "function") {
        await db.batch([release, write]);
      } else {
        await release;
        await write;
      }
    } else {
      await write;
    }
  }

  console.log(
    "[webhooks/revenuecat]",
    event.type,
    "user=", userId,
    "store=", event.store,
    "applied=", { newStatus, newSource, setPeriodEnd },
  );

  return NextResponse.json({ ok: true });
}
