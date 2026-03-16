import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, studySessions, wattsTransactions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { getUserClassification, getClassificationTitle } from "@/lib/voltage";
import { calculateWattsServerSide } from "@/lib/watts";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, questionsReviewed, questionsCorrect } = body;

    // Server-side watts calculation — ignore any client-provided wattsEarned
    const wattsEarned = calculateWattsServerSide("review_complete", questionsCorrect ?? 0, questionsReviewed ?? 0);

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Get current user state
    const [currentUser] = await db
      .select({
        wattsBalance: users.wattsBalance,
        wattsLifetime: users.wattsLifetime,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const newBalance = (currentUser?.wattsBalance || 0) + wattsEarned;
    const newLifetime = (currentUser?.wattsLifetime || 0) + wattsEarned;

    // Update the session record
    await db
      .update(studySessions)
      .set({
        endedAt: new Date(),
        wattsEarned,
        questionsAnswered: questionsReviewed ?? null,
        questionsCorrect: questionsCorrect ?? null,
      })
      .where(
        and(
          eq(studySessions.id, sessionId),
          eq(studySessions.userId, session.user.id)
        )
      );

    // Update user Watts
    await db
      .update(users)
      .set({
        wattsBalance: newBalance,
        wattsLifetime: newLifetime,
        xp: newLifetime,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Log transaction
    await db.insert(wattsTransactions).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      type: "review_complete",
      amount: wattsEarned,
      balanceAfter: newBalance,
      voltageAtTime: 277,
      ampsAtTime: questionsCorrect ?? 0,
      description: `Review session complete (${questionsReviewed || 0} questions)`,
    });

    const classification = getUserClassification(newBalance).classification;
    const classificationTitle = getClassificationTitle(newBalance);

    return NextResponse.json({
      success: true,
      wattsEarned,
      wattsBalance: newBalance,
      classification,
      classificationTitle,
    });
  } catch (error) {
    console.error("Error completing review session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
