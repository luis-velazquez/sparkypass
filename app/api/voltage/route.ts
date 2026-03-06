import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getUserClassification, getClassificationProgress } from "@/lib/voltage";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user] = await db
      .select({
        wattsBalance: users.wattsBalance,
        wattsLifetime: users.wattsLifetime,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const wattsBalance = user?.wattsBalance || 0;
    const progress = getClassificationProgress(wattsBalance);

    return NextResponse.json({
      classification: progress.current.classification,
      classificationTitle: progress.current.title,
      wattsBalance,
      wattsLifetime: user?.wattsLifetime || 0,
      nextClassification: progress.next ? {
        classification: progress.next.classification,
        title: progress.next.title,
        minWatts: progress.next.minWatts,
      } : null,
      progressPercentage: progress.percentage,
    });
  } catch (error) {
    console.error("Error fetching classification data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
