import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq, inArray, or } from "drizzle-orm";
import { getClassificationTitle } from "@/lib/voltage";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  wattsLifetime: number;
  classificationTitle: string;
  studyStreak: number;
  leaderboardTier: string;
  isCurrentUser: boolean;
  isBetaTester: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalParticipants: number;
  currentUserRank: number;
  currentUserHasUsername: boolean;
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

    // Fetch all subscribed users (active or trialing) who have set a username
    const participants = await db
      .select({
        id: users.id,
        username: users.username,
        wattsLifetime: users.wattsLifetime,
        wattsBalance: users.wattsBalance,
        studyStreak: users.studyStreak,
        betaAgreedAt: users.betaAgreedAt,
        subscriptionStatus: users.subscriptionStatus,
      })
      .from(users)
      .where(
        or(
          inArray(users.subscriptionStatus, ["active", "trialing"]),
          eq(users.id, userId),
        ),
      );

    // Only users with a username appear on the leaderboard
    const visible = participants.filter((u: any) => !!u.username);

    // Sort by watts lifetime descending
    visible.sort((a: any, b: any) => b.wattsLifetime - a.wattsLifetime);

    // Build leaderboard entries
    const leaderboard: LeaderboardEntry[] = visible.map((user: any, index: any) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      wattsLifetime: user.wattsLifetime,
      classificationTitle: getClassificationTitle(user.wattsBalance),
      studyStreak: user.studyStreak,
      leaderboardTier: getLeaderboardTier(user.wattsLifetime),
      isCurrentUser: user.id === userId,
      isBetaTester: !!user.betaAgreedAt,
    }));

    const currentUser = participants.find((u: any) => u.id === userId);
    const currentUserHasUsername = !!currentUser?.username;
    const currentUserRank = leaderboard.find((e) => e.isCurrentUser)?.rank || 0;

    const response: LeaderboardResponse = {
      leaderboard,
      totalParticipants: leaderboard.length,
      currentUserRank,
      currentUserHasUsername,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
