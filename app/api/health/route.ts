import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const services: Record<string, { status: "operational" | "degraded" | "down"; latencyMs?: number }> = {};

  // Check database
  const dbStart = Date.now();
  try {
    await db.select({ count: sql<number>`count(*)` }).from(users).limit(1);
    services.database = { status: "operational", latencyMs: Date.now() - dbStart };
  } catch {
    services.database = { status: "down", latencyMs: Date.now() - dbStart };
  }

  // Check auth (NextAuth endpoint)
  const authStart = Date.now();
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/auth/providers`, {
      signal: AbortSignal.timeout(5000),
    });
    services.authentication = {
      status: res.ok ? "operational" : "degraded",
      latencyMs: Date.now() - authStart,
    };
  } catch {
    services.authentication = { status: "degraded", latencyMs: Date.now() - authStart };
  }

  // App server is operational if this endpoint responds
  services.application = { status: "operational", latencyMs: 0 };

  // Email — check if API key is configured
  services.email = {
    status: process.env.RESEND_API_KEY ? "operational" : "degraded",
  };

  const allOperational = Object.values(services).every((s) => s.status === "operational");
  const anyDown = Object.values(services).some((s) => s.status === "down");

  return NextResponse.json({
    overall: anyDown ? "down" : allOperational ? "operational" : "degraded",
    services,
    timestamp: new Date().toISOString(),
  });
}
