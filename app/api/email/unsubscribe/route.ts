// POST /api/email/unsubscribe?u=<user id>&t=<signed token>
//
// Two callers:
//   - Mail apps' own "Unsubscribe" button (Gmail, Apple Mail). The offer
//     emails carry List-Unsubscribe + List-Unsubscribe-Post (RFC 8058), so the
//     mail app POSTs here with body "List-Unsubscribe=One-Click". Answer 200.
//   - The confirm button on /unsubscribe (a normal form POST). Redirect back to
//     the page, which then says "You're unsubscribed".
// GET does nothing on purpose: link scanners open every link in an email, and
// that must never unsubscribe anyone.

import { NextRequest, NextResponse } from "next/server";
import { setOfferEmailsOff, verifyUnsubscribeToken } from "@/lib/offer/unsubscribe";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  let userId = params.get("u") ?? "";
  let token = params.get("t") ?? "";
  let fromPage = false;

  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (form) {
      fromPage = form.get("source") === "page";
      userId = (form.get("u") as string | null) ?? userId;
      token = (form.get("t") as string | null) ?? token;
    }
  }

  if (!verifyUnsubscribeToken(userId, token)) {
    if (fromPage) return NextResponse.redirect(`${SITE_URL}/unsubscribe?error=1`, 303);
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  await setOfferEmailsOff(userId);

  if (fromPage) return NextResponse.redirect(`${SITE_URL}/unsubscribe?done=1`, 303);
  return NextResponse.json({ ok: true });
}
