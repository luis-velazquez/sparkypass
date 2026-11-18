import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import {
  CREW_CODE_LENGTH,
  crewCodeOwner,
  crewDisplayName,
  makeCrew,
  normalizeCrewCode,
} from "@/lib/crew";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/friends/code/redeem { code } — join someone's crew with their
// code. Both users become crew at once (an accepted friendship).
//   200 { status: "added" | "already", friend: { name } }
//   404 { error: "invalid_code" }  — unknown, deleted, or blocked
//   400 { error: "own_code" }
// A 10-minute cap per user slows guessing (the code space is ~887 million).
const redeemLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const me = session.user.id;
    if (!redeemLimiter.check(me).success) {
      return NextResponse.json({ error: "Too many tries. Try again in a few minutes." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? normalizeCrewCode(body.code) : "";
    if (code.length !== CREW_CODE_LENGTH) {
      return NextResponse.json({ error: "invalid_code" }, { status: 404 });
    }

    const ownerId = await crewCodeOwner(code);
    if (!ownerId) {
      return NextResponse.json({ error: "invalid_code" }, { status: 404 });
    }
    if (ownerId === me) {
      return NextResponse.json({ error: "own_code" }, { status: 400 });
    }

    // A code whose owner is in the 30-day deletion grace is dead.
    const [owner] = await db
      .select({ username: users.username, name: users.name })
      .from(users)
      .where(and(eq(users.id, ownerId), isNull(users.deletedAt)))
      .limit(1);
    if (!owner) {
      return NextResponse.json({ error: "invalid_code" }, { status: 404 });
    }

    const status = await makeCrew(me, ownerId);
    if (status === "blocked") {
      // Don't reveal the block: it reads as a code that doesn't work.
      return NextResponse.json({ error: "invalid_code" }, { status: 404 });
    }
    return NextResponse.json({
      status,
      friend: { name: crewDisplayName(owner.username, owner.name) },
    });
  } catch (error) {
    console.error("Error redeeming crew code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
