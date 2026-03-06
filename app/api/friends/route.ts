import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, friendships } from "@/lib/db";
import { eq, and, or, ne } from "drizzle-orm";
import { getClassificationTitle } from "@/lib/voltage";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all friendships involving this user (not blocked)
    const allFriendships = await db
      .select({
        id: friendships.id,
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
        status: friendships.status,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .where(
        and(
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId),
          ),
          ne(friendships.status, "blocked"),
        ),
      );

    // Collect all friend user IDs
    const friendUserIds = new Set<string>();
    allFriendships.forEach((f) => {
      friendUserIds.add(f.requesterId === userId ? f.addresseeId : f.requesterId);
    });

    // Fetch user data for all friends
    const friendUsers = friendUserIds.size > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            username: users.username,
            wattsLifetime: users.wattsLifetime,
            wattsBalance: users.wattsBalance,
            studyStreak: users.studyStreak,
          })
          .from(users)
          .where(or(...[...friendUserIds].map((id) => eq(users.id, id))))
      : [];

    const userMap = new Map(friendUsers.map((u) => [u.id, u]));

    // Categorize friendships
    const accepted: typeof result = [];
    const pendingIncoming: typeof result = [];
    const pendingOutgoing: typeof result = [];

    type FriendInfo = {
      friendshipId: string;
      friendId: string;
      name: string;
      username: string | null;
      wattsLifetime: number;
      classificationTitle: string;
      studyStreak: number;
      since: string | null;
    };

    const result: FriendInfo[] = [];

    allFriendships.forEach((f) => {
      const friendId = f.requesterId === userId ? f.addresseeId : f.requesterId;
      const user = userMap.get(friendId);
      if (!user) return;

      const info: FriendInfo = {
        friendshipId: f.id,
        friendId: user.id,
        name: user.name,
        username: user.username,
        wattsLifetime: user.wattsLifetime,
        classificationTitle: getClassificationTitle(user.wattsBalance),
        studyStreak: user.studyStreak,
        since: f.createdAt?.toISOString() || null,
      };

      if (f.status === "accepted") {
        accepted.push(info);
      } else if (f.status === "pending") {
        if (f.requesterId === userId) {
          pendingOutgoing.push(info);
        } else {
          pendingIncoming.push(info);
        }
      }
    });

    // Sort accepted friends by watts lifetime descending
    accepted.sort((a, b) => b.wattsLifetime - a.wattsLifetime);

    return NextResponse.json({
      friends: accepted,
      pendingIncoming,
      pendingOutgoing,
      totalFriends: accepted.length,
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
