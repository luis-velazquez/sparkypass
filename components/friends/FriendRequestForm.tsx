"use client";

import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FriendRequestFormProps {
  onRequestSent: () => void;
}

export function FriendRequestForm({ onRequestSent }: FriendRequestFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Friend request sent!" });
        setEmail("");
        onRequestSent();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send request" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter friend's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !email.trim()} size="sm">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add
            </>
          )}
        </Button>
      </div>
      {message && (
        <p className={`text-xs ${message.type === "success" ? "text-emerald dark:text-sparky-green" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
