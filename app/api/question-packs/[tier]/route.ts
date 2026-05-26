// GET /api/question-packs/[tier]
//
// Returns the full question array for a tier (apprentice|journeyman|master).
// Supports conditional GET via If-None-Match (returns 304 when ETag matches).
//
// v1 content delivery (per audit OQ#6): direct from Vercel, no CDN. The mobile
// client caches the response keyed by ETag and only refetches when the
// manifest reports a new ETag.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

const TIERS = ["apprentice", "journeyman", "master"] as const;
type Tier = (typeof TIERS)[number];

const QUESTIONS_DIR = path.join(process.cwd(), "data", "questions");

// Per-tier cache. ETag is computed from the serialized payload.
const PACK_TTL_MS = 5 * 60 * 1000;
const cache = new Map<Tier, { computedAt: number; json: string; etag: string }>();

async function buildPack(tier: Tier): Promise<{ json: string; etag: string }> {
  const files = (await fs.readdir(QUESTIONS_DIR)).filter((f) => f.endsWith(".json"));
  const all: unknown[] = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(QUESTIONS_DIR, file), "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown[]>;
    const tierQuestions = parsed[tier];
    if (Array.isArray(tierQuestions)) all.push(...tierQuestions);
  }
  const json = JSON.stringify(all);
  const etag = crypto.createHash("sha256").update(json).digest("hex").slice(0, 16);
  return { json, etag };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tier: string }> },
) {
  const { tier: tierParam } = await params;
  if (!(TIERS as readonly string[]).includes(tierParam)) {
    return NextResponse.json(
      { error: `Unknown tier "${tierParam}". Valid: ${TIERS.join(", ")}`, code: "BAD_TIER" },
      { status: 400 },
    );
  }
  const tier = tierParam as Tier;

  try {
    const now = Date.now();
    let entry = cache.get(tier);
    if (!entry || now - entry.computedAt > PACK_TTL_MS) {
      const built = await buildPack(tier);
      entry = { computedAt: now, ...built };
      cache.set(tier, entry);
    }

    // Conditional GET: 304 when client's ETag matches.
    const inm = request.headers.get("if-none-match");
    if (inm && inm.replace(/^W\//, "").replace(/^"|"$/g, "") === entry.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: `"${entry.etag}"`,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new NextResponse(entry.json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ETag: `"${entry.etag}"`,
        "Cache-Control": "public, max-age=86400",  // 1 day; manifest is the canonical bust signal
      },
    });
  } catch (err) {
    console.error(`[question-packs/${tier}] Failed:`, err);
    return NextResponse.json(
      { error: "Failed to build pack", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
