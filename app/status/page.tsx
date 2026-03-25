"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Zap, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BetaBadge } from "@/components/ui/beta-badge";

interface ServiceStatus {
  status: "operational" | "degraded" | "down";
  latencyMs?: number;
}

interface HealthData {
  overall: "operational" | "degraded" | "down";
  services: Record<string, ServiceStatus>;
  timestamp: string;
}

const statusConfig = {
  operational: { label: "Operational", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500" },
  degraded: { label: "Degraded", icon: AlertTriangle, color: "text-amber", bg: "bg-amber" },
  down: { label: "Down", icon: XCircle, color: "text-red-500", bg: "bg-red-500" },
};

const serviceLabels: Record<string, string> = {
  application: "Application Server",
  database: "Database",
  authentication: "Authentication",
  email: "Email Service",
};

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setLastChecked(new Date());
      }
    } catch {
      setHealth({
        overall: "down",
        services: { application: { status: "down" } },
        timestamp: new Date().toISOString(),
      });
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchHealth, 60_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const overallConfig = health ? statusConfig[health.overall] : statusConfig.operational;
  const OverallIcon = overallConfig.icon;

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
      <div className="max-w-2xl mx-auto relative z-10">
        <Card className="shadow-lg border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <Zap className="h-10 w-10 text-amber" />
            </Link>
            <CardTitle className="text-2xl font-bold font-display flex items-center justify-center gap-2">
              System Status <BetaBadge size="md" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall status */}
            <div className={`flex items-center justify-center gap-3 rounded-lg border p-4 ${
              health?.overall === "operational"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : health?.overall === "degraded"
                  ? "border-amber/30 bg-amber/5"
                  : "border-red-500/30 bg-red-500/5"
            }`}>
              {loading ? (
                <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
              ) : (
                <OverallIcon className={`h-5 w-5 ${overallConfig.color}`} />
              )}
              <span className={`font-semibold ${loading ? "text-muted-foreground" : overallConfig.color}`}>
                {loading ? "Checking..." : `All Systems ${overallConfig.label}`}
              </span>
            </div>

            {/* Individual services */}
            {health && (
              <div className="space-y-2">
                {Object.entries(health.services).map(([key, service]) => {
                  const config = statusConfig[service.status];
                  const Icon = config.icon;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border border-border dark:border-stone-800 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${config.bg}`} />
                        <span className="text-sm font-medium text-foreground">
                          {serviceLabels[key] || key}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {service.latencyMs !== undefined && service.latencyMs > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {service.latencyMs}ms
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {lastChecked
                  ? `Last checked: ${lastChecked.toLocaleTimeString()}`
                  : "Checking..."}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchHealth}
                disabled={loading}
                className="text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              SparkyPass is in beta. Occasional downtime is expected.{" "}
              <Link href="/known-issues" className="text-amber hover:text-amber-dark underline">
                View known issues
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
