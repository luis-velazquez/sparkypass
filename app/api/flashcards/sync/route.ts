// POST /api/flashcards/sync
//
// Uploads a phone's changed flash card rows and highlights and returns what
// changed on other devices. Separate from /api/sync/upload on purpose: flash
// cards earn no Watts and touch no streak, history or weak-spot data.
// Conflict rules live in lib/flashcard-sync.ts.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { applySync, parseSyncBody } from "@/lib/flashcard-sync";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

export async function POST(req: Request) {
  const session = await auth(); // accepts the mobile Bearer token
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!limiter.check(userId).success) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterSeconds: 60 },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad body", code: "BAD_BODY" }, { status: 400 });
  }
  const parsed = parseSyncBody(json);
  if (!parsed.ok) return NextResponse.json({ error: "Bad body", code: parsed.code }, { status: 400 });
  if (parsed.body.ownerId !== userId) {
    return NextResponse.json({ error: "Owner mismatch", code: "OWNER_MISMATCH" }, { status: 409 });
  }
  try {
    return NextResponse.json(await applySync(db, userId, parsed.body, Date.now()));
  } catch (err) {
    console.error("[flashcards/sync]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
