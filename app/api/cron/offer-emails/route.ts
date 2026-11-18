// GET /api/cron/offer-emails
//
// Vercel Cron — Monday to Saturday, 15:00 UTC (vercel.json): 9–10 AM in Texas,
// and never Sunday anywhere in the US. Sends the free-week and $0.99 offer
// emails (lib/offer/run.ts; HQ Plan/sparkypass-offer-emails-plan.md).
//
// Test mode unless OFFER_EMAILS_ENABLED=true: it reports who would get what
// (counts and user ids, never addresses) and sends nothing. `?dryRun=1`
// forces test mode even when sending is on.
//
// `?samples=1` sends one copy of every email (1, 2A, 2B, 3) with made-up
// numbers and a sample code to OFFER_TEST_TO only, so they can be checked on a
// phone before launch. Same CRON_SECRET as the scheduled run.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyCronRequest } from "@/lib/cron-auth";
import { runOfferJob } from "@/lib/offer/run";
import {
  fullPriceText,
  liveSendProblems,
  mailingAddress,
  offerEnabled,
  offerFrom,
  offerPriceText,
  redeemUrl,
  replyTo,
} from "@/lib/offer/config";
import { renderDay15, renderDay19, renderDay6 } from "@/lib/offer/emails";
import { SITE_URL } from "@/lib/site";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;

  if (params.get("samples") === "1") return sendSamples();

  const live = offerEnabled() && params.get("dryRun") !== "1";
  const result = await runOfferJob({ live });
  console.log("[cron/offer-emails]", JSON.stringify({ ...result, ran_at: new Date().toISOString() }));
  for (const w of result.warnings) console.warn("[cron/offer-emails]", w);
  return NextResponse.json({ ok: true, ...result, ran_at: new Date().toISOString() });
}

async function sendSamples() {
  const to = process.env.OFFER_TEST_TO?.trim();
  const problems = liveSendProblems();
  if (!to) problems.push("OFFER_TEST_TO is not set");
  if (!to || problems.length > 0) {
    return NextResponse.json({ ok: false, problems }, { status: 400 });
  }
  const code = "SAMPLECODE123";
  const useBy = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tz = "America/Chicago";
  const footer = {
    unsubscribeUrl: `${SITE_URL}/unsubscribe?sample=1`,
    mailingAddress: mailingAddress()!,
  };
  const common = { code, redeemUrl: redeemUrl(code), useBy, timeZone: tz, price: offerPriceText(), fullPrice: fullPriceText() };
  const samples = [
    renderDay6({ name: "Luis Velazquez", when: "tomorrow", answered: 42, watts: 1250, fullPrice: fullPriceText() }, footer),
    renderDay15({ name: "Luis Velazquez", version: "A", answered: 42, watts: 1250, ...common }, footer),
    renderDay15({ name: "Luis Velazquez", version: "B", answered: 3, watts: 60, ...common }, footer),
    renderDay19({ name: "Luis Velazquez", daysLeft: 3, ...common }, footer),
  ];
  const resend = new Resend(process.env.RESEND_API_KEY);
  const sent: string[] = [];
  for (const s of samples) {
    const { data, error } = await resend.emails.send({
      from: offerFrom()!,
      to,
      replyTo: replyTo(),
      subject: `[Sample] ${s.subject}`,
      html: s.html,
      text: s.text,
    });
    if (error) return NextResponse.json({ ok: false, sent, error: error.message }, { status: 502 });
    sent.push(data?.id ?? "");
    await new Promise((r) => setTimeout(r, 600));
  }
  return NextResponse.json({ ok: true, samples: sent.length });
}
