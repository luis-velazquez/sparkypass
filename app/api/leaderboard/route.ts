import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, friendships } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";
import { getClassificationTitle } from "@/lib/voltage";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  username: string | null;
  wattsLifetime: number;
  classificationTitle: string;
  studyStreak: number;
  leaderboardTier: string;
  isCurrentUser: boolean;
  isBetaTester: boolean;
}

function getLeaderboardTier(wattsLifetime: number): string {
  if (wattsLifetime >= 100_000) return "The Transformer";
  if (wattsLifetime >= 25_000) return "Service Entrance";
  if (wattsLifetime >= 5_000) return "Main Lug";
  return "Sub-Panel";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all accepted friendships
    const acceptedFriendships = await db
      .select({
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
      })
      .from(friendships)
      .where(
        and(
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId),
          ),
          eq(friendships.status, "accepted"),
        ),
      );

    // Collect friend IDs + current user
    const friendIds = new Set<string>([userId]);
    acceptedFriendships.forEach((f: any) => {
      friendIds.add(f.requesterId === userId ? f.addresseeId : f.requesterId);
    });

    // Fetch user data for all participants
    const participants = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        wattsLifetime: users.wattsLifetime,
        wattsBalance: users.wattsBalance,
        studyStreak: users.studyStreak,
        betaAgreedAt: users.betaAgreedAt,
      })
      .from(users)
      .where(or(...[...friendIds].map((id) => eq(users.id, id))));

    // Sort by watts lifetime descending
    participants.sort((a: any, b: any) => b.wattsLifetime - a.wattsLifetime);

    // Build leaderboard entries
    const leaderboard: LeaderboardEntry[] = participants.map((user: any, index: any) => ({
      rank: index + 1,
      userId: user.id,
      name: user.name,
      username: user.username,
      wattsLifetime: user.wattsLifetime,
      classificationTitle: getClassificationTitle(user.wattsBalance),
      studyStreak: user.studyStreak,
      leaderboardTier: getLeaderboardTier(user.wattsLifetime),
      isCurrentUser: user.id === userId,
      isBetaTester: !!user.betaAgreedAt,
    }));

    // Find current user's rank
    const currentUserRank = leaderboard.find((e) => e.isCurrentUser)?.rank || 0;

    return NextResponse.json({
      leaderboard,
      totalParticipants: leaderboard.length,
      currentUserRank,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
