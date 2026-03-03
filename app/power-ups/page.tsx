"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Zap, Package, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SparkyMessage } from "@/components/sparky";
import { PowerUpShelf, ActivePowerUpBanner } from "@/components/power-ups";
import { getRandomUnseenTip, getSeenTipIds, markTipSeen } from "@/lib/tips";
import type { PowerUpTypeValue } from "@/lib/db/schema";
import type { Tip } from "@/types/tip";

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
  const [purchasedTip, setPurchasedTip] = useState<Tip | null>(null);

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

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchPowerUps();
  }, [status, fetchPowerUps]);

  const handlePurchase = async (type: PowerUpTypeValue) => {
    try {
      const res = await fetch("/api/power-ups/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        setWattsBalance(data.wattsBalance);
        window.dispatchEvent(new CustomEvent("watts-updated", { detail: { balance: data.wattsBalance } }));
        fetchPowerUps();

        if (type === "sparky_tip") {
          const seenIds = getSeenTipIds();
          const tip = getRandomUnseenTip(seenIds);
          if (tip) {
            markTipSeen(tip.id);
            setPurchasedTip(tip);
          }
        }
      }
    } catch {
      // Silently fail
    }
  };

  const handleActivate = async (purchaseId: string) => {
    try {
      const res = await fetch("/api/power-ups/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId }),
      });
      if (res.ok) {
        fetchPowerUps();
      }
    } catch {
      // Silently fail
    }
  };

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
            message="Use your hard-earned Watts to buy power-ups! Protect your streak with a Fuse, reveal formulas with a Formula Sheet, or instantly reset a tripped breaker."
          />
        </motion.div>

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
      </div>

      {/* Sparky Tip dialog */}
      <Dialog open={!!purchasedTip} onOpenChange={(isOpen) => { if (!isOpen) setPurchasedTip(null); }}>
        <DialogContent className="sm:max-w-lg dark:bg-stone-900 dark:border-stone-800 max-h-[calc(100dvh-2rem)] overflow-y-auto">
          {purchasedTip && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-amber/20 dark:bg-sparky-green/20 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-amber dark:text-sparky-green" />
                  </div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Sparky Tip
                  </DialogTitle>
                </div>
                <DialogDescription asChild>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-amber/10 dark:bg-sparky-green/10 text-amber dark:text-sparky-green font-medium">
                      {purchasedTip.category}
                    </span>
                    <span>{purchasedTip.necReference}</span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-foreground">{purchasedTip.title}</h3>

                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {purchasedTip.content}
                </p>

                {purchasedTip.formulas && purchasedTip.formulas.length > 0 && (
                  <div className="space-y-2">
                    {purchasedTip.formulas.map((formula, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 rounded-lg bg-amber/10 dark:bg-sparky-green/10 border border-amber/20 dark:border-sparky-green/20"
                      >
                        <code className="text-sm font-mono font-semibold text-amber dark:text-sparky-green">
                          {formula}
                        </code>
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-3 py-2.5 rounded-lg bg-purple/10 dark:bg-purple/10 border border-purple/20 dark:border-purple/20">
                  <p className="text-sm font-medium text-purple dark:text-purple-light">
                    <span className="font-bold">Sparky&apos;s Bottom Line:</span>{" "}
                    {purchasedTip.sparkyBottomLine}
                  </p>
                </div>

                <Button
                  onClick={() => setPurchasedTip(null)}
                  className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 focus-visible:ring-amber/50 dark:focus-visible:ring-sparky-green/50 focus-visible:border-transparent"
                >
                  Got it!
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
