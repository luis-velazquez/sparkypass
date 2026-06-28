import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, friendships } from "@/lib/db";
import { eq, and, or, inArray } from "drizzle-orm";
import { getPortaJonTitle } from "@/lib/porta-jon";

// GET /api/porta-jon/leaderboard — the crew board: the current user plus their
// accepted friends, ranked by lifetime challenges completed (scrolls dodged),
// tiebroken by current throne streak.
export interface PortaJonLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  scrollsDodged: number;
  throneStreak: number;
  title: string;
  titleIcon: string;
  isCurrentUser: boolean;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const me = session.user.id;

    // Accepted friendships involving me → the crew.
    const links = await db
      .select({
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
      })
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me)),
        ),
      );

    const crewIds = new Set<string>([me]);
    for (const link of links) {
      crewIds.add(link.requesterId === me ? link.addresseeId : link.requesterId);
    }

    type CrewRow = {
      id: string;
      username: string | null;
      name: string;
      scrollsDodged: number;
      throneStreak: number;
    };
    const rows: CrewRow[] = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        scrollsDodged: users.scrollsDodged,
        throneStreak: users.throneStreak,
      })
      .from(users)
      .where(inArray(users.id, Array.from(crewIds)));

    const leaderboard: PortaJonLeaderboardEntry[] = rows
      .sort(
        (a: CrewRow, b: CrewRow) =>
          (b.scrollsDodged || 0) - (a.scrollsDodged || 0) ||
          (b.throneStreak || 0) - (a.throneStreak || 0),
      )
      .map((u: CrewRow, i: number) => {
        const title = getPortaJonTitle(u.scrollsDodged || 0);
        return {
          rank: i + 1,
          userId: u.id,
          username: u.username || u.name || "Electrician",
          scrollsDodged: u.scrollsDodged || 0,
          throneStreak: u.throneStreak || 0,
          title: title.title,
          titleIcon: title.icon,
          isCurrentUser: u.id === me,
        };
      });

    return NextResponse.json({ leaderboard, crewSize: leaderboard.length });
  } catch (error) {
    console.error("Error fetching porta jon leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
