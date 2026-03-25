import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Resend } from "resend";
import crypto from "crypto";
import { db, users, wattsTransactions } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

const MAX_MESSAGE_LENGTH = 2000;
const FEEDBACK_WATTS_REWARD = 25;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, message, page } = body;

    const validTypes = ["bug", "improvement", "confusing"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    const typeLabels: Record<string, string> = {
      bug: "Bug Report",
      improvement: "Suggestion",
      confusing: "Confusing",
    };

    const contactEmail = process.env.CONTACT_EMAIL || "avgluis@gmail.com";
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress =
      process.env.EMAIL_FROM || "SparkyPass <onboarding@resend.dev>";

    const emailContent = `
Beta Feedback: ${typeLabels[type]}
============================

From: ${(session.user.name || "Unknown").replace(/[<>]/g, "")}
Email: ${session.user.email || "N/A"}
Type: ${typeLabels[type]}
Page: ${(page || "Unknown").replace(/[<>]/g, "")}
Submitted: ${new Date().toISOString()}

Message:
${message.trim()}

============================
This feedback was submitted via the SparkyPass Beta feedback widget.
`.trim();

    try {
      await resend.emails.send({
        from: fromAddress,
        to: contactEmail,
        subject: `[Beta Feedback] ${typeLabels[type]} — ${session.user.name || session.user.email}`,
        replyTo: session.user.email || undefined,
        text: emailContent,
      });
    } catch (emailError) {
      console.error("[FEEDBACK] Failed to send email:", emailError);
    }

    // Award Watts for feedback submission
    let wattsAwarded = 0;
    if (session.user.id) {
      try {
        const [updatedUser] = await db
          .update(users)
          .set({
            wattsBalance: sql`${users.wattsBalance} + ${FEEDBACK_WATTS_REWARD}`,
            wattsLifetime: sql`${users.wattsLifetime} + ${FEEDBACK_WATTS_REWARD}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, session.user.id))
          .returning({ wattsBalance: users.wattsBalance });

        await db.insert(wattsTransactions).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          type: "beta_feedback",
          amount: FEEDBACK_WATTS_REWARD,
          balanceAfter: updatedUser.wattsBalance,
          voltageAtTime: 0,
          ampsAtTime: 0,
          description: `Beta feedback: ${typeLabels[type]}`,
        });

        wattsAwarded = FEEDBACK_WATTS_REWARD;
      } catch (wattsError) {
        console.error("[FEEDBACK] Failed to award Watts:", wattsError);
      }
    }

    return NextResponse.json({ success: true, wattsAwarded });
  } catch (error) {
    console.error("[FEEDBACK] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
