import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, friendships } from "@/lib/db";
import { eq, and, or, ne, inArray, isNull } from "drizzle-orm";
import { crewDisplayName } from "@/lib/crew";
import { getPortaJonTitle } from "@/lib/porta-jon";

// GET /api/friends — the Throne Room crew list: accepted friends, requests
// waiting on you, and requests you sent. Friends see only the basics: a
// display name (username, else first name) and Throne Room stats. Never an
// email, a phone number or study data. Users in the 30-day deletion grace
// are left out.
export interface CrewFriend {
  friendshipId: string;
  friendId: string;
  name: string;
  title: string;
  titleIcon: string;
  scrollsDodged: number;
  longestStreak: number;
  since: string | null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const allFriendships = await db
      .select({
        id: friendships.id,
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        updatedAt: friendships.updatedAt,
      })
      .from(friendships)
      .where(
        and(
          or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
          ne(friendships.status, "blocked"),
          ne(friendships.status, "declined"),
        ),
      );

    const friendUserIds: string[] = [
      ...new Set<string>(
        allFriendships.map((f: { requesterId: string; addresseeId: string }) =>
          f.requesterId === userId ? f.addresseeId : f.requesterId,
        ),
      ),
    ];

    type Row = {
      id: string;
      name: string;
      username: string | null;
      scrollsDodged: number | null;
      portaJonLongestStreak: number | null;
    };
    const friendUsers: Row[] =
      friendUserIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              username: users.username,
              scrollsDodged: users.scrollsDodged,
              portaJonLongestStreak: users.portaJonLongestStreak,
            })
            .from(users)
            .where(and(inArray(users.id, friendUserIds), isNull(users.deletedAt)))
        : [];
    const userMap = new Map(friendUsers.map((u) => [u.id, u]));

    const friends: CrewFriend[] = [];
    const pendingIncoming: CrewFriend[] = [];
    const pendingOutgoing: CrewFriend[] = [];

    for (const f of allFriendships) {
      const friendId = f.requesterId === userId ? f.addresseeId : f.requesterId;
      const u = userMap.get(friendId);
      if (!u) continue;
      const scrolls = u.scrollsDodged || 0;
      const title = getPortaJonTitle(scrolls);
      const info: CrewFriend = {
        friendshipId: f.id,
        friendId: u.id,
        name: crewDisplayName(u.username, u.name),
        title: title.title,
        titleIcon: title.icon,
        scrollsDodged: scrolls,
        longestStreak: u.portaJonLongestStreak || 0,
        since: (f.status === "accepted" ? f.updatedAt : f.createdAt)?.toISOString() || null,
      };
      if (f.status === "accepted") friends.push(info);
      else if (f.requesterId === userId) pendingOutgoing.push(info);
      else pendingIncoming.push(info);
    }

    friends.sort((a, b) => b.scrollsDodged - a.scrollsDodged || a.name.localeCompare(b.name));

    return NextResponse.json({
      friends,
      pendingIncoming,
      pendingOutgoing,
      totalFriends: friends.length,
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
