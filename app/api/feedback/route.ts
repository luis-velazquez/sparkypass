// POST /api/feedback
//
// Per audit OQ#9 resolution: Watts rewards are kept at public launch, but
// gated on manual moderation to prevent spam farming. Anti-spam stack:
//   - Per-user rate limit: 1 reward-eligible submission per 24h
//   - Minimum length: 50 chars (whitespace trimmed)
//   - Insert as `pending`; admin queue approves → that's when Watts are awarded
//
// Email is still sent on every submission so the team gets the inbox ping
// regardless of moderation state.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { auth } from "@/auth";
import { db, feedback, feedbackTypeValues } from "@/lib/db";

const MAX_MESSAGE_LENGTH = 2000;
const MIN_MESSAGE_LENGTH = 50;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

interface RequestBody {
  type?: unknown;
  message?: unknown;
  page?: unknown;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const type = typeof body.type === "string" ? body.type : null;
  const message = typeof body.message === "string" ? body.message : null;
  const page = typeof body.page === "string" ? body.page : null;

  if (!type || !(feedbackTypeValues as readonly string[]).includes(type)) {
    return NextResponse.json(
      { error: "Invalid feedback type", code: "INVALID_TYPE" },
      { status: 400 },
    );
  }

  if (!message) {
    return NextResponse.json(
      { error: "Message is required", code: "MISSING_MESSAGE" },
      { status: 400 },
    );
  }

  const trimmed = message.trim();
  if (trimmed.length < MIN_MESSAGE_LENGTH) {
    return NextResponse.json(
      {
        error: `Feedback must be at least ${MIN_MESSAGE_LENGTH} characters so reviewers can act on it.`,
        code: "TOO_SHORT",
        minLength: MIN_MESSAGE_LENGTH,
      },
      { status: 400 },
    );
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less`, code: "TOO_LONG" },
      { status: 400 },
    );
  }

  // Rate limit — 1 submission per user per 24h. The check is on submission count
  // not reward-eligible specifically; rejecting a user for resubmitting too fast
  // is acceptable since we expect mod queue turnaround to be slower than 24h
  // anyway.
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recent = await db
    .select({ id: feedback.id })
    .from(feedback)
    .where(and(eq(feedback.userId, userId), gt(feedback.createdAt, cutoff)));

  if (recent.length > 0) {
    return NextResponse.json(
      {
        error: "Please wait 24 hours between feedback submissions.",
        code: "RATE_LIMITED",
      },
      { status: 429, headers: { "Retry-After": String(RATE_LIMIT_WINDOW_MS / 1000) } },
    );
  }

  // Persist before any I/O so the moderation queue is the source of truth.
  await db.insert(feedback).values({
    id: crypto.randomUUID(),
    userId,
    type: type as (typeof feedbackTypeValues)[number],
    message: trimmed,
    page: page ?? null,
    moderationStatus: "pending",
  });

  // Notification email — best-effort, failure here doesn't fail the request.
  try {
    const typeLabels: Record<string, string> = {
      bug: "Bug Report",
      improvement: "Suggestion",
      confusing: "Confusing",
    };
    const contactEmail = process.env.CONTACT_EMAIL || "avgluis@gmail.com";
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.EMAIL_FROM || "SparkyPass <onboarding@resend.dev>";

    const safeName = (session.user.name || "Unknown").replace(/[<>]/g, "");
    const safePage = (page || "Unknown").replace(/[<>]/g, "");
    const emailContent = `
Feedback: ${typeLabels[type]}
============================

From: ${safeName}
Email: ${session.user.email || "N/A"}
Type: ${typeLabels[type]}
Page: ${safePage}
Submitted: ${new Date().toISOString()}

Message:
${trimmed}

============================
Moderate at /admin/feedback to award Watts.
`.trim();

    await resend.emails.send({
      from: fromAddress,
      to: contactEmail,
      subject: `[Feedback] ${typeLabels[type]} — ${safeName}`,
      replyTo: session.user.email || undefined,
      text: emailContent,
    });
  } catch (emailError) {
    console.error("[FEEDBACK] Email send failed:", emailError);
  }

  // Note: Watts are NOT awarded here. They are awarded when an admin approves
  // the feedback via /admin/feedback (Phase 3H — moderation queue UI).
  return NextResponse.json({
    success: true,
    moderationStatus: "pending",
    wattsAwarded: 0,
    note: "Watts are awarded after a brief review.",
  });
}
