"use client";

import { motion } from "framer-motion";
import { ShieldOff } from "lucide-react";

interface TripAnimationProps {
  categoryName: string;
}

export function TripAnimation({ categoryName }: TripAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
        className="text-center p-8"
      >
        {/* Flash effect */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0, 1, 0, 0.5, 0] }}
          transition={{ duration: 0.8, times: [0, 0.1, 0.2, 0.3, 0.5, 0.8] }}
          className="fixed inset-0 bg-red-500/20 pointer-events-none"
        />

        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ShieldOff className="h-20 w-20 text-red-500 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-black text-red-500 mb-2"
        >
          BREAKER TRIPPED!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/80 text-lg mb-1"
        >
          {categoryName}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-white/60 text-sm"
        >
          2 consecutive wrong answers — 30 minute cooldown
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
