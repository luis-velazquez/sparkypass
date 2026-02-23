"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Coins } from "lucide-react";

export function CoinBalance() {
  const { status } = useSession();
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.coins !== undefined) {
          setCoins(data.coins);
        }
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number") {
        setCoins(detail);
      }
    };
    window.addEventListener("coins-updated", handler);
    return () => window.removeEventListener("coins-updated", handler);
  }, []);

  if (status !== "authenticated" || coins === null) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber/10 text-amber text-sm font-semibold">
      <Coins className="h-4 w-4" />
      {coins.toLocaleString()}
    </div>
  );
}
