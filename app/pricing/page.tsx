"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Check,
  Shield,
  BookOpen,
  Gamepad2,
  Calculator,
  TrendingUp,
  Calendar,
  Trophy,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BetaBadge } from "@/components/ui/beta-badge";
import { SparkyMessage } from "@/components/sparky";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const features = [
  { icon: BookOpen, label: "500+ NEC practice questions with explanations" },
  { icon: Gamepad2, label: "Interactive games — Index Sniper, Translation Engine, and more" },
  { icon: Layers, label: "Flashcards for key formulas & code references" },
  { icon: Calendar, label: "Daily challenges and study streaks" },
  { icon: Calculator, label: "Residential & commercial load calculator tools" },
  { icon: TrendingUp, label: "Progress tracking across all NEC categories" },
  { icon: Trophy, label: "Leaderboards and Ohm's Law reward system" },
  { icon: Shield, label: "Timed mock exams that mirror the real test" },
];

export default function PricingPage() {
  return (
    <>
    <LandingNav />
    <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 pt-24 pb-12">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center mb-6"
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Free During Beta
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          SparkyPass is currently in beta. All features are completely free for beta testers
          — no credit card, no commitment.
        </p>
      </motion.div>

      {/* Beta badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative z-10 text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald/10 border border-emerald/20 text-emerald dark:bg-sparky-green/10 dark:border-sparky-green/20 dark:text-sparky-green text-sm font-medium">
          <Zap className="h-4 w-4" />
          30-day free trial — no credit card required
        </div>
      </motion.div>

      {/* Single card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 max-w-2xl mx-auto mb-10"
      >
        <Card className="border-amber/30 dark:border-sparky-green/30 shadow-lg bg-card dark:bg-stone-900/50">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardTitle className="text-2xl font-display">Beta Access</CardTitle>
              <BetaBadge size="md" />
            </div>
            <div className="mt-3">
              <span className="text-5xl font-bold text-amber dark:text-sparky-green">Free</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Full access to every feature. Pricing will be announced at launch.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.label} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-emerald flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature.label}</span>
                  </li>
                );
              })}
            </ul>
            <Button
              asChild
              className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 font-semibold"
            >
              <Link href="/register">
                <Zap className="h-4 w-4 mr-2" />
                Start Your Free Beta Trial
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Already have an account?{" "}
              <Link href="/login" className="text-amber hover:text-amber-dark underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sparky Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative z-10 max-w-2xl mx-auto"
      >
        <SparkyMessage
          size="medium"
          message="You're getting in early! Beta testers who help shape the product will be rewarded when we launch. Your feedback matters."
        />
      </motion.div>
    </main>
    <LandingFooter />
    </>
  );
}
