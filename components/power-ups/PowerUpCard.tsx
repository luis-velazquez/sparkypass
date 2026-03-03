"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, FileText, RotateCcw, Lightbulb, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PowerUpTypeValue } from "@/lib/db/schema";

const ICON_MAP: Record<string, typeof Shield> = {
  Shield,
  FileText,
  RotateCcw,
  Lightbulb,
};

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
  const canAfford = wattsBalance >= cost;
  const Icon = ICON_MAP[iconName] || Shield;

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await onPurchase(type);
    } finally {
      setPurchasing(false);
    }
  };

  const handleActivate = async () => {
    if (!inventoryId) return;
    setActivating(true);
    try {
      await onActivate(inventoryId);
    } finally {
      setActivating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="border-border dark:border-stone-800 h-full">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-amber dark:text-sparky-green" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-foreground">{name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{duration}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            {description}
          </p>

          {/* Cost + inventory */}
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1 text-sm font-bold text-amber dark:text-sparky-green">
              <Zap className="h-3.5 w-3.5 fill-current" />
              {cost}W
            </span>
            {inventoryCount > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {inventoryCount} owned
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handlePurchase}
              disabled={!canAfford || purchasing}
            >
              {purchasing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>Buy</>
              )}
            </Button>
            {inventoryCount > 0 && type !== "breaker_reset" && type !== "sparky_tip" && (
              <Button
                size="sm"
                className="flex-1 bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                onClick={handleActivate}
                disabled={activating || !inventoryId}
              >
                {activating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>Activate</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
