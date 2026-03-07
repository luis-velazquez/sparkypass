"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CollapsibleCard({
  title,
  icon,
  iconColor,
  children,
  defaultExpanded = false,
  collapsible = true,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const canCollapse = collapsible;
  const shouldShowContent = !canCollapse || isExpanded;

  return (
    <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
      <CardHeader
        className={`pb-3 ${canCollapse ? "cursor-pointer pressable" : ""}`}
        onClick={() => canCollapse && setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className={iconColor}>{icon}</span>
            {title}
          </span>
          {canCollapse && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </CardTitle>
      </CardHeader>
      <AnimatePresence initial={false}>
        {shouldShowContent && (
          <motion.div
            initial={canCollapse ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={canCollapse ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
