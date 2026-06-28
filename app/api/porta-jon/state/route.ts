import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  portaJonCooldownRemaining,
  getPortaJonTitleProgress,
} from "@/lib/porta-jon";

// GET /api/porta-jon/state — drives the Dashboard tile + the pre-start gate.
// Returns whether the 2h cooldown has elapsed, the throne streak, the
// scrolls-dodged tally, and the current/next title.
export interface PortaJonStateResponse {
  canPlay: boolean;
  cooldownRemainingMs: number;
  throneStreak: number;
  throneStreakBest: number;
  scrollsDodged: number;
  title: string;
  titleIcon: string;
  nextTitle: string | null;
  challengesToNextTitle: number;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [u] = await db
      .select({
        throneStreak: users.throneStreak,
        throneStreakBest: users.throneStreakBest,
        throneLastCompletedAt: users.throneLastCompletedAt,
        scrollsDodged: users.scrollsDodged,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!u) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const remaining = portaJonCooldownRemaining(u.throneLastCompletedAt ?? null);
    const progress = getPortaJonTitleProgress(u.scrollsDodged || 0);

    const payload: PortaJonStateResponse = {
      canPlay: remaining === 0,
      cooldownRemainingMs: remaining,
      throneStreak: u.throneStreak || 0,
      throneStreakBest: u.throneStreakBest || 0,
      scrollsDodged: u.scrollsDodged || 0,
      title: progress.current.title,
      titleIcon: progress.current.icon,
      nextTitle: progress.next?.title ?? null,
      challengesToNextTitle: progress.remaining,
    };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching porta jon state:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
