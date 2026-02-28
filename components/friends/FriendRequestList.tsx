"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendingFriend {
  friendshipId: string;
  name: string;
  username: string | null;
  tierTitle: string;
  tierVoltage: string;
}

interface FriendRequestListProps {
  incoming: PendingFriend[];
  outgoing: PendingFriend[];
  onUpdate: () => void;
}

export function FriendRequestList({ incoming, outgoing, onUpdate }: FriendRequestListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (friendshipId: string, action: "accept" | "decline") => {
    setLoadingId(friendshipId);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        onUpdate();
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingId(null);
    }
  };

  if (incoming.length === 0 && outgoing.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">
            Incoming Requests ({incoming.length})
          </h3>
          <div className="space-y-2">
            {incoming.map((req, index) => (
              <motion.div
                key={req.friendshipId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-amber/5 dark:bg-sparky-green/5 border border-amber/20 dark:border-sparky-green/15"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{req.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.tierVoltage} {req.tierTitle}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(req.friendshipId, "accept")}
                    disabled={loadingId === req.friendshipId}
                    className="h-8 px-2"
                  >
                    {loadingId === req.friendshipId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-emerald dark:text-sparky-green" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(req.friendshipId, "decline")}
                    disabled={loadingId === req.friendshipId}
                    className="h-8 px-2"
                  >
                    <X className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing requests */}
      {outgoing.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">
            Sent Requests ({outgoing.length})
          </h3>
          <div className="space-y-2">
            {outgoing.map((req, index) => (
              <motion.div
                key={req.friendshipId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border dark:border-stone-800"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{req.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.tierVoltage} {req.tierTitle}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Pending
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
