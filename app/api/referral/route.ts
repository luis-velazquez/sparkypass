import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { db, users, referrals, wattsTransactions, type Referral } from "@/lib/db";
import { eq, sql, and } from "drizzle-orm";

const REFERRAL_WATTS_REWARD = 100;

function generateReferralCode(): string {
  // 6-char alphanumeric code (uppercase)
  return crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
}

// GET — get or create the user's referral code + stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for existing referral code
    const existing = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, session.user.id),
          eq(referrals.referredUserId, session.user.id) // self-referral row = code holder
        )
      )
      .limit(1);

    let code: string;
    if (existing.length > 0) {
      code = existing[0].code;
    } else {
      // Generate a unique code
      code = generateReferralCode();
      let attempts = 0;
      while (attempts < 5) {
        const [dup] = await db.select().from(referrals).where(eq(referrals.code, code)).limit(1);
        if (!dup) break;
        code = generateReferralCode();
        attempts++;
      }

      await db.insert(referrals).values({
        id: crypto.randomUUID(),
        referrerId: session.user.id,
        referredUserId: session.user.id, // self-ref row marks code ownership
        code,
        status: "completed",
      });
    }

    // Count successful referrals
    const allReferrals = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, session.user.id),
          eq(referrals.status, "completed")
        )
      );

    // Exclude self-referral row from count
    const actualReferrals = allReferrals.filter(
      (r: Referral) => r.referredUserId !== session.user!.id
    );
    const completedCount = actualReferrals.length;

    const totalWattsEarned = actualReferrals.reduce(
      (sum: number, r: Referral) => sum + r.wattsAwarded, 0
    );

    return NextResponse.json({
      code,
      completedCount,
      totalWattsEarned,
      rewardPerReferral: REFERRAL_WATTS_REWARD,
    });
  } catch (error) {
    console.error("[REFERRAL] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — redeem a referral code (called during registration)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, referredUserId } = body;

    if (!code || !referredUserId) {
      return NextResponse.json({ error: "Code and user ID required" }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Find the referral code owner
    const [codeRow] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.code, normalizedCode))
      .limit(1);

    if (!codeRow) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const referrerId = codeRow.referrerId;

    // Can't refer yourself
    if (referrerId === referredUserId) {
      return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
    }

    // Check if this user was already referred
    const [existingReferral] = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referredUserId, referredUserId),
          eq(referrals.status, "completed")
        )
      )
      .limit(1);

    if (existingReferral && existingReferral.referrerId !== existingReferral.referredUserId) {
      return NextResponse.json({ error: "Already referred" }, { status: 409 });
    }

    // Create referral record
    await db.insert(referrals).values({
      id: crypto.randomUUID(),
      referrerId,
      referredUserId,
      code: normalizedCode,
      status: "completed",
      wattsAwarded: REFERRAL_WATTS_REWARD,
      completedAt: new Date(),
    });

    // Award Watts to referrer
    const [updatedUser] = await db
      .update(users)
      .set({
        wattsBalance: sql`${users.wattsBalance} + ${REFERRAL_WATTS_REWARD}`,
        wattsLifetime: sql`${users.wattsLifetime} + ${REFERRAL_WATTS_REWARD}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, referrerId))
      .returning({ wattsBalance: users.wattsBalance });

    await db.insert(wattsTransactions).values({
      id: crypto.randomUUID(),
      userId: referrerId,
      type: "referral_bonus",
      amount: REFERRAL_WATTS_REWARD,
      balanceAfter: updatedUser.wattsBalance,
      voltageAtTime: 0,
      ampsAtTime: 0,
      description: "Referral bonus — new beta tester joined",
    });

    return NextResponse.json({ success: true, wattsAwarded: REFERRAL_WATTS_REWARD });
  } catch (error) {
    console.error("[REFERRAL] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
