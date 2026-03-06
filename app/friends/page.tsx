"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Users, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { FriendRequestForm, FriendRequestList, FriendCard } from "@/components/friends";

interface FriendInfo {
  friendshipId: string;
  friendId: string;
  name: string;
  username: string | null;
  wattsLifetime: number;
  classificationTitle: string;
  studyStreak: number;
  since: string | null;
}

export default function FriendsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<FriendInfo[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<FriendInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchFriends = useCallback(() => {
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => {
        setFriends(data.friends || []);
        setPendingIncoming(data.pendingIncoming || []);
        setPendingOutgoing(data.pendingOutgoing || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchFriends();
  }, [status, fetchFriends]);

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  const hasPending = pendingIncoming.length > 0 || pendingOutgoing.length > 0;

  const sparkyMessage = friends.length === 0
    ? "Add your study buddies to compare progress and motivate each other! Enter their email below to send a friend request."
    : `You have ${friends.length} friend${friends.length !== 1 ? "s" : ""}! Check the leaderboard to see how you stack up.`;

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)",
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
              <span className="text-sky-500 dark:text-sky-400">Friends</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground">
              Study together, compete on the leaderboard.
            </p>
            <Link href="/leaderboard">
              <Button variant="outline" size="sm">
                <Trophy className="h-3.5 w-3.5 mr-1.5" />
                Leaderboard
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

        {/* Add friend form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-border dark:border-stone-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-500" />
                Add a Friend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FriendRequestForm onRequestSent={fetchFriends} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending requests */}
        {hasPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6"
          >
            <Card className="border-border dark:border-stone-800">
              <CardContent className="pt-5">
                <FriendRequestList
                  incoming={pendingIncoming}
                  outgoing={pendingOutgoing}
                  onUpdate={fetchFriends}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Friends list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {friends.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Your Friends ({friends.length})
              </h2>
              {friends.map((friend, index) => (
                <FriendCard
                  key={friend.friendshipId}
                  friendshipId={friend.friendshipId}
                  name={friend.name}
                  username={friend.username}
                  wattsLifetime={friend.wattsLifetime}
                  classificationTitle={friend.classificationTitle}
                  studyStreak={friend.studyStreak}
                  since={friend.since}
                  onRemove={fetchFriends}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <Card className="border-border dark:border-stone-800 border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No friends yet. Send a request above!
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </main>
  );
}
