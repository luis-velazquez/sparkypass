// GET /api/admin/feedback?status=pending&limit=50
//
// Admin-only list view for the moderation queue. Filters by moderation status
// (defaults to pending) and returns the most recent submissions with the
// submitter's name + email joined in.

import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import {
  db,
  feedback,
  users,
  feedbackModerationValues,
} from "@/lib/db";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function isAdmin(userId: string): boolean {
  const allowlist = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowlist.includes(userId);
}

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") ?? "pending";
  const status = (feedbackModerationValues as readonly string[]).includes(statusParam)
    ? (statusParam as (typeof feedbackModerationValues)[number])
    : "pending";

  const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const rows = await db
    .select({
      id: feedback.id,
      type: feedback.type,
      message: feedback.message,
      page: feedback.page,
      moderationStatus: feedback.moderationStatus,
      rewardedAt: feedback.rewardedAt,
      createdAt: feedback.createdAt,
      userId: feedback.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.userId, users.id))
    .where(eq(feedback.moderationStatus, status))
    .orderBy(desc(feedback.createdAt))
    .limit(limit);

  return NextResponse.json({
    items: rows,
    status,
    limit,
    count: rows.length,
  });
}
