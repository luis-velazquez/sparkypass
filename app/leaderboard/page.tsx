"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Trophy, Users, UserCircle2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { LeaderboardTable, TierBadge } from "@/components/leaderboard";
import type { LeaderboardEntry } from "@/app/api/leaderboard/route";

export default function LeaderboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [hasUsername, setHasUsername] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.leaderboard || []);
        setCurrentUserRank(data.currentUserRank || 0);
        setTotalParticipants(data.totalParticipants || 0);
        setHasUsername(data.currentUserHasUsername !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  const sparkyMessage = !hasUsername
    ? "Pick a username to claim your spot on the leaderboard! Your real name stays private."
    : entries.length <= 1
      ? "You're the first one here! As more electricians join, you'll see them on the leaderboard."
      : currentUserRank === 1
        ? "You're in first place! Keep those Watts flowing to stay on top!"
        : `You're ranked #${currentUserRank} out of ${totalParticipants}. Keep studying to climb the ranks!`;

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
              <span className="text-amber dark:text-sparky-green">Leaderboard</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground">
              Compete with friends for the most Watts.
            </p>
            <Link href="/friends">
              <Button variant="outline" size="sm">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Friends
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Sparky message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6"
        >
          <SparkyMessage size="medium" message={sparkyMessage} />
        </motion.div>

        {/* Tier legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <TierBadge tier="Sub-Panel" />
              &lt; 5K
            </span>
            <span className="flex items-center gap-1.5">
              <TierBadge tier="Main Lug" />
              5K–25K
            </span>
            <span className="flex items-center gap-1.5">
              <TierBadge tier="Service Entrance" />
              25K–100K
            </span>
            <span className="flex items-center gap-1.5">
              <TierBadge tier="The Transformer" />
              100K+
            </span>
          </div>
        </motion.div>

        {/* Username CTA — show when current user has no username */}
        {!hasUsername && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6"
          >
            <Card className="border-amber/30 dark:border-sparky-green/20 bg-amber/5 dark:bg-sparky-green/5">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserCircle2 className="h-6 w-6 text-amber dark:text-sparky-green flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">Set a username to appear</p>
                    <p className="text-xs text-muted-foreground">
                      Your real name is never shown on the leaderboard.
                    </p>
                  </div>
                </div>
                <Link href="/settings" className="flex-shrink-0">
                  <Button size="sm">Set username</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Your rank card — only when on the board with at least one other person */}
        {hasUsername && entries.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6"
          >
            <Card className="border-amber/30 dark:border-sparky-green/20 bg-amber/5 dark:bg-sparky-green/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className={`h-6 w-6 ${currentUserRank === 1 ? "text-amber" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-bold text-foreground">Your Rank</p>
                    <p className="text-xs text-muted-foreground">
                      out of {totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <span className="text-3xl font-bold font-mono text-amber dark:text-sparky-green">
                  #{currentUserRank}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <LeaderboardTable entries={entries} />
        </motion.div>
      </div>
    </main>
  );
}
