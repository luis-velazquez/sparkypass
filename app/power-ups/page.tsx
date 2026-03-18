"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Zap, Package, Crosshair, Languages, Workflow, Lock, Check, Brain, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { PowerUpShelf, ActivePowerUpBanner } from "@/components/power-ups";
import { getRandomUnseenTip, getSeenTipIds, markTipSeen } from "@/lib/tips";
import { POWER_UP_LIST } from "@/lib/power-ups";
import type { PowerUpTypeValue } from "@/lib/db/schema";
import type { PackMeta, GameId } from "@/lib/game-packs";

interface ActivePowerUp {
  id: string;
  type: PowerUpTypeValue;
  purchasedAt: string | null;
  expiresAt: string | null;
}

interface InventoryItem {
  id: string;
  type: PowerUpTypeValue;
  purchasedAt: string | null;
}

export default function PowerUpsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [wattsBalance, setWattsBalance] = useState(0);
  const [active, setActive] = useState<ActivePowerUp[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Game pack state
  const [packCatalog, setPackCatalog] = useState<Record<GameId, PackMeta[]>>({
    "index-sniper": [],
    "translation-engine": [],
    "formula-builder": [],
  });
  const [ownedPacks, setOwnedPacks] = useState<Record<GameId, string[]>>({
    "index-sniper": ["free"],
    "translation-engine": ["free"],
    "formula-builder": ["free"],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchPowerUps = useCallback(() => {
    fetch("/api/power-ups")
      .then((res) => res.json())
      .then((data) => {
        setWattsBalance(data.wattsBalance || 0);
        setActive(data.active || []);
        setInventory(data.inventory || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchGamePacks = useCallback(() => {
    fetch("/api/game-packs")
      .then((res) => res.json())
      .then((data) => {
        if (data.catalog) setPackCatalog(data.catalog);
        if (data.owned) setOwnedPacks(data.owned);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchPowerUps();
    fetchGamePacks();
  }, [status, fetchPowerUps, fetchGamePacks]);

  const handlePurchase = async (type: PowerUpTypeValue) => {
    const res = await fetch("/api/power-ups/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Purchase failed");
    }
    setWattsBalance(data.wattsBalance);
    window.dispatchEvent(new CustomEvent("watts-updated", { detail: { balance: data.wattsBalance } }));
    fetchPowerUps();

    if (type === "sparky_tip") {
      const seenIds = getSeenTipIds();
      const tip = getRandomUnseenTip(seenIds);
      if (tip) {
        markTipSeen(tip.id);
        router.push("/tips");
      }
    }
  };

  const handleActivate = async (purchaseId: string) => {
    const res = await fetch("/api/power-ups/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId }),
    });
    if (!res.ok) {
      throw new Error("Activation failed");
    }
    fetchPowerUps();
  };

  const handlePackPurchase = async (gameId: GameId, packId: string, packName: string, packCost: number) => {
    try {
      const res = await fetch("/api/game-packs/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, packId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWattsBalance(data.wattsBalance);
        setOwnedPacks((prev) => ({
          ...prev,
          [gameId]: [...(prev[gameId] || []), packId],
        }));
        window.dispatchEvent(new CustomEvent("watts-updated", { detail: { balance: data.wattsBalance } }));
        toast.success(`${packName} unlocked!`, {
          description: `−${packCost}W from your balance`,
        });
      } else {
        toast.error("Purchase failed", {
          description: data.error || "Something went wrong.",
        });
      }
    } catch {
      toast.error("Purchase failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const GAME_SECTIONS: { id: GameId; label: string; icon: typeof Crosshair }[] = [
    { id: "index-sniper", label: "Index Sniper", icon: Crosshair },
    { id: "translation-engine", label: "Translation Engine", icon: Languages },
    { id: "formula-builder", label: "Formula Builder", icon: Workflow },
  ];

  // Only show games that have purchasable packs
  const gamesWithPacks = GAME_SECTIONS.filter((g) => packCatalog[g.id].length > 0);

  // Check if user can afford the cheapest power-up
  const cheapestCost = Math.min(...POWER_UP_LIST.map((p) => p.cost));
  const cantAffordAnything = wattsBalance < cheapestCost;

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

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
      <div className="container mx-auto px-4 py-8 relative z-10">
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
              <span className="text-amber dark:text-sparky-green">Power-Ups</span>
            </h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Spend your Watts on study power-ups.
            </p>
            <div className="flex items-center gap-1 text-lg font-bold text-amber dark:text-sparky-green">
              <Zap className="h-5 w-5 fill-current" />
              {wattsBalance.toLocaleString()}W
            </div>
          </div>
        </motion.div>

        {/* Sparky message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6"
        >
          <SparkyMessage
            size="medium"
            message={
              cantAffordAnything
                ? "Looks like you need more Watts! Play quizzes, games, or complete daily challenges to earn more. You'll be back shopping in no time!"
                : "Use your hard-earned Watts to buy power-ups! Protect your streak with a Fuse, reveal formulas with a Formula Sheet, or instantly reset a tripped breaker."
            }
            variant={cantAffordAnything ? "sad" : undefined}
          />
        </motion.div>

        {/* Empty state — can't afford anything */}
        {cantAffordAnything && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-amber/20 dark:border-stone-800 bg-amber/5 dark:bg-stone-900/50">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Need more Watts? Here&apos;s how to earn:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      icon: Brain,
                      title: "Take a Quiz",
                      desc: "Up to 208W per correct answer",
                      href: "/quiz",
                    },
                    {
                      icon: Gamepad2,
                      title: "Play Games",
                      desc: "12W per correct in mini-games",
                      href: "/index-sniper",
                    },
                    {
                      icon: Zap,
                      title: "Daily Challenge",
                      desc: "277W per correct + streak bonuses",
                      href: "/daily",
                    },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-start gap-3 rounded-lg border border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 p-3 hover:border-amber/30 dark:hover:border-sparky-green/20 transition-colors"
                    >
                      <item.icon className="h-5 w-5 text-amber dark:text-sparky-green shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active power-ups */}
        {active.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-amber/30 dark:border-sparky-green/20 bg-amber/5 dark:bg-sparky-green/5">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber dark:text-sparky-green" />
                  Active Power-Ups
                </h2>
                <ActivePowerUpBanner activePowerUps={active} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Power-up shop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <PowerUpShelf
            wattsBalance={wattsBalance}
            inventory={inventory}
            onPurchase={handlePurchase}
            onActivate={handleActivate}
          />
        </motion.div>

        {/* Game Expansion Packs */}
        {gamesWithPacks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-amber dark:text-sparky-green" />
              Game Expansion Packs
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Unlock new card packs for your favorite games.
            </p>

            <div className="space-y-6">
              {gamesWithPacks.map((game) => {
                const GameIcon = game.icon;
                const catalog = packCatalog[game.id];
                const owned = new Set(ownedPacks[game.id] || []);

                return (
                  <div key={game.id}>
                    <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                      <GameIcon className="h-4 w-4 text-amber dark:text-sparky-green" />
                      {game.label}
                      <span className="text-xs text-muted-foreground font-normal ml-auto">
                        {catalog.filter((p) => owned.has(p.id)).length}/{catalog.length} owned
                      </span>
                    </h3>
                    <div className="grid gap-2">
                      {catalog.map((pack) => {
                        const isOwned = owned.has(pack.id);
                        const canAfford = wattsBalance >= pack.cost;

                        return (
                          <div
                            key={pack.id}
                            className={`flex items-center justify-between p-3 rounded-xl border bg-card dark:bg-stone-900/50 transition-all ${
                              isOwned
                                ? "border-emerald-500/30 dark:border-sparky-green/30"
                                : "border-border dark:border-stone-800 hover:border-amber/20 dark:hover:border-stone-700"
                            }`}
                          >
                            <div className="flex-1 min-w-0 mr-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground truncate">
                                  {pack.name}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {pack.cardCount} {pack.cardCount === 1 ? "item" : "items"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {pack.description}
                              </p>
                            </div>
                            {isOwned ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 dark:text-sparky-green shrink-0">
                                <Check className="h-3.5 w-3.5" />
                                Owned
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                disabled={!canAfford}
                                onClick={() =>
                                  handlePackPurchase(game.id, pack.id, pack.name, pack.cost)
                                }
                                className="shrink-0 bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 disabled:opacity-50"
                              >
                                {canAfford ? (
                                  <>
                                    <Zap className="h-3.5 w-3.5 mr-1" />
                                    {pack.cost}W
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3.5 w-3.5 mr-1" />
                                    {pack.cost}W
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

    </main>
  );
}
