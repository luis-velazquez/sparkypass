import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, wattsTransactions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user] = await db
      .select({ wattsBalance: users.wattsBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

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
      .where(eq(wattsTransactions.userId, userId))
      .orderBy(desc(wattsTransactions.createdAt))
      .limit(50);

    return NextResponse.json({
      wattsBalance: user?.wattsBalance ?? 0,
      transactions: transactions.map((t: any) => ({
        ...t,
        createdAt: t.createdAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching watts transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
