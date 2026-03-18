"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, FileText, RotateCcw, Lightbulb, Zap, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PowerUpTypeValue } from "@/lib/db/schema";

const ICON_MAP: Record<string, typeof Shield> = {
  Shield,
  FileText,
  RotateCcw,
  Lightbulb,
};

/* Cost-based accent tiers */
const TIER_STYLES: Record<number, { ring: string; glow: string; badge: string }> = {
  1000: {
    ring: "hover:border-amber/50 dark:hover:border-amber/40",
    glow: "hover:shadow-[0_4px_24px_rgba(245,158,11,0.25)] dark:hover:shadow-[0_4px_24px_rgba(245,158,11,0.15)]",
    badge: "bg-gradient-to-r from-amber/15 to-orange-500/15 text-amber-dark dark:from-amber/20 dark:to-orange-500/20 dark:text-amber",
  },
  200: {
    ring: "hover:border-purple-400/40 dark:hover:border-purple-400/30",
    glow: "hover:shadow-[0_4px_20px_rgba(139,92,246,0.15)] dark:hover:shadow-[0_4px_20px_rgba(139,92,246,0.1)]",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  150: {
    ring: "hover:border-amber/40 dark:hover:border-sparky-green/30",
    glow: "hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_4px_20px_rgba(163,255,0,0.08)]",
    badge: "bg-amber/10 text-amber dark:text-sparky-green",
  },
  100: {
    ring: "hover:border-emerald-400/40 dark:hover:border-emerald-400/30",
    glow: "hover:shadow-[0_4px_20px_rgba(16,185,129,0.12)] dark:hover:shadow-[0_4px_20px_rgba(16,185,129,0.08)]",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

function getTierStyle(cost: number) {
  return TIER_STYLES[cost] || TIER_STYLES[100];
}

interface PowerUpCardProps {
  type: PowerUpTypeValue;
  name: string;
  description: string;
  cost: number;
  duration: string;
  iconName: string;
  wattsBalance: number;
  inventoryCount: number;
  onPurchase: (type: PowerUpTypeValue) => Promise<void>;
  onActivate: (purchaseId: string) => Promise<void>;
  inventoryId?: string;
  index: number;
}

export function PowerUpCard({
  type,
  name,
  description,
  cost,
  duration,
  iconName,
  wattsBalance,
  inventoryCount,
  onPurchase,
  onActivate,
  inventoryId,
  index,
}: PowerUpCardProps) {
  const [purchasing, setPurchasing] = useState(false);
  const [activating, setActivating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canAfford = wattsBalance >= cost;
  const Icon = ICON_MAP[iconName] || Shield;
  const tier = getTierStyle(cost);

  const handlePurchase = async () => {
    setConfirmOpen(false);
    setPurchasing(true);
    try {
      await onPurchase(type);
      toast.success(`${name} purchased!`, {
        description: `−${cost}W from your balance`,
      });
    } catch {
      toast.error("Purchase failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleActivate = async () => {
    if (!inventoryId) return;
    setActivating(true);
    try {
      await onActivate(inventoryId);
      toast.success(`${name} activated!`);
    } catch {
      toast.error("Activation failed");
    } finally {
      setActivating(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <div
          className={`relative rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 h-full transition-all duration-300 hover:-translate-y-1 ${tier.ring} ${tier.glow}`}
        >
          {/* Cost badge — top right */}
          <div
            className={`absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${tier.badge}`}
          >
            <Zap className="h-3 w-3 fill-current" />
            {cost}W
          </div>

          <div className="p-5 flex flex-col h-full">
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center mb-4">
              <Icon className="h-5.5 w-5.5 text-amber dark:text-sparky-green" />
            </div>

            {/* Name + duration */}
            <h3 className="font-bold text-foreground mb-0.5">{name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{duration}</p>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-5 flex-1">
              {description}
            </p>

            {/* Inventory badge */}
            {inventoryCount > 0 && (
              <div className="mb-3">
                <span className="text-xs text-emerald-600 dark:text-sparky-green bg-emerald-500/10 dark:bg-sparky-green/10 px-2 py-0.5 rounded-full font-medium">
                  {inventoryCount} owned
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 transition-colors"
                onClick={() => {
                  if (!canAfford) {
                    toast.error("Not enough Watts", {
                      description: `You need ${cost}W but only have ${wattsBalance.toLocaleString()}W. Earn more through quizzes and games!`,
                    });
                    return;
                  }
                  setConfirmOpen(true);
                }}
                disabled={purchasing}
              >
                {purchasing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Buy"
                )}
              </Button>
              {inventoryCount > 0 &&
                type !== "breaker_reset" &&
                type !== "sparky_tip" && (
                  <Button
                    size="sm"
                    className="flex-1 bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                    onClick={handleActivate}
                    disabled={activating || !inventoryId}
                  >
                    {activating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Activate"
                    )}
                  </Button>
                )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Purchase confirmation overlay */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-900 p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-amber dark:text-sparky-green" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Buy {name}?</h3>
                    <p className="text-xs text-muted-foreground">{duration}</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-lg bg-muted/50 dark:bg-stone-800/50 p-3 mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-bold text-amber dark:text-sparky-green flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    {cost}W
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current balance</span>
                  <span className="font-medium text-foreground">
                    {wattsBalance.toLocaleString()}W
                  </span>
                </div>
                <hr className="border-border dark:border-stone-700" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">After purchase</span>
                  <span className="font-bold text-foreground">
                    {(wattsBalance - cost).toLocaleString()}W
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 font-bold"
                  onClick={handlePurchase}
                >
                  <Zap className="h-3.5 w-3.5 mr-1 fill-current" />
                  Confirm Purchase
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
