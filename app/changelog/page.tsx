"use client";

import Link from "next/link";
import { Zap, Plus, Wrench, Bug, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BetaBadge } from "@/components/ui/beta-badge";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: "added" | "improved" | "fixed";
    description: string;
  }[];
}

const typeConfig = {
  added: { label: "Added", icon: Plus, color: "text-emerald-500 bg-emerald-500/10" },
  improved: { label: "Improved", icon: Sparkles, color: "text-amber bg-amber/10 dark:text-sparky-green dark:bg-sparky-green/10" },
  fixed: { label: "Fixed", icon: Bug, color: "text-blue-500 bg-blue-500/10" },
};

// Add new entries at the top
const changelog: ChangelogEntry[] = [
  {
    version: "0.9.0-beta",
    date: "March 25, 2026",
    changes: [
      { type: "added", description: "Beta badge across all pages to clearly indicate beta status" },
      { type: "added", description: "Dismissible beta banner on the landing page" },
      { type: "added", description: "In-app feedback widget — report bugs, suggest improvements, or flag confusing content from any page" },
      { type: "added", description: "Beta Participation Agreement with click-wrap consent at signup" },
      { type: "added", description: "Age verification (18+) during registration" },
      { type: "added", description: "Changelog page (you're looking at it!)" },
      { type: "added", description: "Known Issues page for transparency on current bugs" },
      { type: "added", description: "Error tracking and crash reporting for faster bug fixes" },
      { type: "added", description: "First-party analytics to understand feature usage" },
      { type: "improved", description: "All transactional emails now include a beta status footer" },
      { type: "improved", description: "Privacy policy updated to reflect analytics and error tracking" },
    ],
  },
  {
    version: "0.8.0-beta",
    date: "March 2026",
    changes: [
      { type: "added", description: "Commercial load calculator with retail, restaurant, office, and warehouse scenarios" },
      { type: "added", description: "Index Sniper game — timed NEC article lookup challenges" },
      { type: "added", description: "Translation Engine game — decode NEC language into plain English" },
      { type: "added", description: "Ohm's Law reward system (Watts, Voltage tiers, Amps)" },
      { type: "added", description: "Circuit Breaker spaced repetition system" },
      { type: "added", description: "Power Grid progress tracking across all NEC categories" },
      { type: "added", description: "Leaderboard with weekly and all-time rankings" },
      { type: "added", description: "Power-Ups shop (Streak Fuse, Double Watts, Voltage Boost)" },
      { type: "improved", description: "Residential load calculator with difficulty levels and motor FLC tables" },
      { type: "fixed", description: "Quiz scoring accuracy for multi-select questions" },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen py-12 px-4 bg-cream dark:bg-stone-950 relative">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="max-w-3xl mx-auto relative z-10">
        <Card className="shadow-lg border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <Zap className="h-10 w-10 text-amber" />
            </Link>
            <CardTitle className="text-2xl font-bold font-display flex items-center justify-center gap-2">
              Changelog <BetaBadge size="md" />
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              What&apos;s new, improved, and fixed in SparkyPass.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {changelog.map((entry) => (
              <div key={entry.version}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-foreground font-display">
                    {entry.version}
                  </h2>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <div className="space-y-2">
                  {entry.changes.map((change, i) => {
                    const config = typeConfig[change.type];
                    const Icon = config.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 py-1.5">
                        <span className={`flex-shrink-0 mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {change.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {entry !== changelog[changelog.length - 1] && (
                  <hr className="mt-6 border-border dark:border-stone-800" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
