// GET /api/watts/transactions?before=<iso8601>&limit=50
//
// Cursor-paginated Watts ledger. The mobile ledger scrolls back by passing
// the createdAt of the oldest already-loaded transaction as `before`. Web
// callers that don't pass `before` get the latest 50 (legacy behavior).

import { NextRequest, NextResponse } from "next/server";
import { eq, and, lt, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users, wattsTransactions } from "@/lib/db";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const beforeParam = searchParams.get("before");
    const before = beforeParam ? new Date(beforeParam) : null;
    if (before && Number.isNaN(before.getTime())) {
      return NextResponse.json(
        { error: "before must be a valid ISO 8601 timestamp", code: "BAD_CURSOR" },
        { status: 400 },
      );
    }

    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const [user] = await db
      .select({ wattsBalance: users.wattsBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const whereClause = before
      ? and(eq(wattsTransactions.userId, userId), lt(wattsTransactions.createdAt, before))
      : eq(wattsTransactions.userId, userId);

    const transactions = await db
      .select({
        id: wattsTransactions.id,
        type: wattsTransactions.type,
        amount: wattsTransactions.amount,
        balanceAfter: wattsTransactions.balanceAfter,
        description: wattsTransactions.description,
        createdAt: wattsTransactions.createdAt,
      })
      .from(wattsTransactions)
      .where(whereClause)
      .orderBy(desc(wattsTransactions.createdAt))
      .limit(limit + 1);  // peek one extra to know if there are more

    const hasMore = transactions.length > limit;
    const page = hasMore ? transactions.slice(0, limit) : transactions;
    const nextCursor = hasMore ? page[page.length - 1].createdAt?.toISOString() ?? null : null;

    return NextResponse.json({
      wattsBalance: user?.wattsBalance ?? 0,
      transactions: page.map((t: typeof page[number]) => ({
        ...t,
        createdAt: t.createdAt?.toISOString() ?? null,
      })),
      nextCursor,  // pass back as `before` to fetch the next page
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching watts transactions:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL" }, { status: 500 });
  }
}
