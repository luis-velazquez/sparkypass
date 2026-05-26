// POST /api/admin/feedback/[id]/moderate
//
// Admin-only. Approve or reject a feedback submission. Approval triggers the
// Watts payout (OQ#9: rewards gated on moderation to prevent spam farming).
// Idempotent — re-approving an already-approved row is a no-op.
//
// Admin auth: ADMIN_USER_IDS env var (comma-separated list of user IDs). Not a
// long-term answer but adequate for v1 with a single founder operator. The
// proper solution (admin role on users table + RBAC) is a v1.1 backlog item.

import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { auth } from "@/auth";
import {
  db,
  feedback,
  users,
  wattsTransactions,
  feedbackModerationValues,
} from "@/lib/db";

const FEEDBACK_WATTS_REWARD = 25;

function isAdmin(userId: string): boolean {
  const allowlist = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowlist.includes(userId);
}

interface RequestBody {
  status?: unknown;
  note?: unknown;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  if (!isAdmin(session.user.id)) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  const { id } = await params;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const status = typeof body.status === "string" ? body.status : null;
  if (!status || !(feedbackModerationValues as readonly string[]).includes(status)) {
    return NextResponse.json(
      {
        error: `status must be one of: ${feedbackModerationValues.join(", ")}`,
        code: "INVALID_STATUS",
      },
      { status: 400 },
    );
  }
  if (status === "pending") {
    // Don't let admins "un-moderate"; that would be confusing.
    return NextResponse.json(
      { error: "Cannot revert moderation to pending", code: "INVALID_STATUS" },
      { status: 400 },
    );
  }

  const [row] = await db.select().from(feedback).where(eq(feedback.id, id)).limit(1);
  if (!row) {
    return NextResponse.json(
      { error: "Feedback not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  // Idempotency: same status, no-op.
  if (row.moderationStatus === status) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      moderationStatus: row.moderationStatus,
      wattsAwarded: status === "approved" ? FEEDBACK_WATTS_REWARD : 0,
    });
  }

  await db
    .update(feedback)
    .set({ moderationStatus: status as (typeof feedbackModerationValues)[number] })
    .where(eq(feedback.id, id));

  if (status !== "approved") {
    return NextResponse.json({
      ok: true,
      idempotent: false,
      moderationStatus: status,
      wattsAwarded: 0,
    });
  }

  // Approved — award Watts now, if not already rewarded.
  if (row.rewardedAt) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      moderationStatus: "approved",
      wattsAwarded: FEEDBACK_WATTS_REWARD,
      note: "Already rewarded previously.",
    });
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      wattsBalance: sql`${users.wattsBalance} + ${FEEDBACK_WATTS_REWARD}`,
      wattsLifetime: sql`${users.wattsLifetime} + ${FEEDBACK_WATTS_REWARD}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, row.userId))
    .returning({ wattsBalance: users.wattsBalance });

  await db.insert(wattsTransactions).values({
    id: crypto.randomUUID(),
    userId: row.userId,
    type: "feedback_approved",
    amount: FEEDBACK_WATTS_REWARD,
    balanceAfter: updatedUser?.wattsBalance ?? 0,
    voltageAtTime: 0,
    ampsAtTime: 0,
    description: `Feedback approved: ${row.type}`,
  });

  await db
    .update(feedback)
    .set({ rewardedAt: new Date() })
    .where(eq(feedback.id, id));

  return NextResponse.json({
    ok: true,
    idempotent: false,
    moderationStatus: "approved",
    wattsAwarded: FEEDBACK_WATTS_REWARD,
    balanceAfter: updatedUser?.wattsBalance ?? 0,
  });
}
