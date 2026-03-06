"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CollapsibleCard({
  title,
  icon,
  iconColor,
  children,
  defaultExpanded = false,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const shouldShowContent = !isMobile || isExpanded;

  return (
    <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
      <CardHeader
        className={`pb-3 ${isMobile ? "cursor-pointer pressable" : ""}`}
        onClick={() => isMobile && setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className={iconColor}>{icon}</span>
            {title}
          </span>
          {isMobile && (
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
            initial={isMobile ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={isMobile ? { height: 0, opacity: 0 } : undefined}
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
