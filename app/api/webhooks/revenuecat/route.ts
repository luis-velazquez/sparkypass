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
// Idempotency: RC retries failed deliveries. Each event has a stable id, and
// the state we mirror is monotonic (subscriptionPeriodEnd only moves forward
// within a chain) — so re-applying the same event is safe.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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
}

interface RCWebhookBody {
  api_version?: string;
  event?: RCEvent;
}

function mapStoreToSource(store: RCStore | undefined): "apple" | "stripe" | "trial" | null {
  switch (store) {
    case "APP_STORE":
    case "MAC_APP_STORE":
      return "apple";
    case "STRIPE":
      return "stripe";
    case "PROMOTIONAL":
      return "trial";
    case "PLAY_STORE":
      // Android isn't v1; if we see it, leave source unchanged.
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
  // subscription_period_end backward. Status moves are still allowed because
  // EXPIRATION should land even if periodEnd was already in the past.
  const setPeriodEnd =
    newPeriodEnd &&
    (!user.subscriptionPeriodEnd ||
      newPeriodEnd.getTime() >= user.subscriptionPeriodEnd.getTime());

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (newStatus) updates.subscriptionStatus = newStatus;
  if (newSource) updates.subscriptionSource = newSource;
  if (setPeriodEnd) updates.subscriptionPeriodEnd = newPeriodEnd;
  if (event.store === "APP_STORE" && event.original_transaction_id) {
    updates.appleOriginalTxId = event.original_transaction_id;
  }

  // Only update if there's something to set.
  if (Object.keys(updates).length > 1) {
    await db.update(users).set(updates).where(eq(users.id, userId));
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
