"use client";

import Link from "next/link";
import { Zap, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BetaBadge } from "@/components/ui/beta-badge";

interface KnownIssue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  severity: "low" | "medium" | "high";
  reportedDate: string;
  resolvedDate?: string;
}

const statusConfig = {
  open: { label: "Open", icon: AlertTriangle, color: "text-red-500 bg-red-500/10" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-amber bg-amber/10 dark:text-sparky-green dark:bg-sparky-green/10" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
};

const severityColors = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-amber/10 text-amber",
  high: "bg-red-500/10 text-red-500",
};

// Add new issues at the top. Move resolved issues to the bottom.
const knownIssues: KnownIssue[] = [
  {
    id: "KI-004",
    title: "Hydration mismatch on some components",
    description: "Some components using Date.now() or window checks during render may show brief flickering on page load. This is a cosmetic issue and does not affect functionality.",
    status: "in_progress",
    severity: "low",
    reportedDate: "March 2026",
  },
  {
    id: "KI-003",
    title: "Bookmarks page TypeScript errors",
    description: "The bookmarks page has pre-existing TypeScript errors related to missing CategorySlug properties. The page may not function correctly.",
    status: "open",
    severity: "medium",
    reportedDate: "March 2026",
  },
  {
    id: "KI-002",
    title: "Formula Builder not yet available",
    description: "The Formula Builder game is still in development and is hidden from navigation. It will be available in a future beta update.",
    status: "in_progress",
    severity: "low",
    reportedDate: "March 2026",
  },
  {
    id: "KI-001",
    title: "Dark mode theme flash on initial load",
    description: "Users with dark mode enabled may see a brief flash of light mode on first page load before the theme is applied.",
    status: "open",
    severity: "low",
    reportedDate: "March 2026",
  },
];

export default function KnownIssuesPage() {
  const openIssues = knownIssues.filter((i) => i.status !== "resolved");
  const resolvedIssues = knownIssues.filter((i) => i.status === "resolved");

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
              Known Issues <BetaBadge size="md" />
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Current bugs and limitations we&apos;re aware of. Found something not listed?{" "}
              <Link href="/contact" className="text-amber hover:text-amber-dark underline">
                Let us know
              </Link>.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Open / In Progress */}
            {openIssues.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Issues ({openIssues.length})
                </h2>
                {openIssues.map((issue) => {
                  const config = statusConfig[issue.status];
                  const Icon = config.icon;
                  return (
                    <div
                      key={issue.id}
                      className="rounded-lg border border-border dark:border-stone-800 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{issue.id}</span>
                          <h3 className="text-sm font-semibold text-foreground">{issue.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${severityColors[issue.severity]}`}>
                            {issue.severity}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${config.color}`}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <p className="text-xs text-muted-foreground/60">Reported: {issue.reportedDate}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resolved */}
            {resolvedIssues.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Recently Resolved ({resolvedIssues.length})
                </h2>
                {resolvedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-lg border border-border dark:border-stone-800 p-4 opacity-60 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-mono text-muted-foreground">{issue.id}</span>
                      <h3 className="text-sm font-semibold text-foreground line-through">{issue.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Resolved: {issue.resolvedDate}</p>
                  </div>
                ))}
              </div>
            )}

            {openIssues.length === 0 && resolvedIssues.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No known issues at this time.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
