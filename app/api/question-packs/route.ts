// GET /api/question-packs
//
// Manifest of available question packs by tier (apprentice/journeyman/master)
// with an ETag for each. The mobile app calls this on startup; if any tier's
// ETag differs from the cached value, it downloads the updated pack from
// /api/question-packs/[tier].
//
// In v1, Apprentice + Journeyman are bundled in the .ipa as a starter set
// (audit OQ#6 + plan §B-8), so the mobile client typically only fetches
// Master on first run. The manifest still includes all three for consistency
// and for clients that want to refresh bundled tiers after an OTA content
// update.

import { NextResponse } from "next/server";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

const TIERS = ["apprentice", "journeyman", "master"] as const;
type Tier = (typeof TIERS)[number];

const QUESTIONS_DIR = path.join(process.cwd(), "data", "questions");

// Cache the manifest in-memory between requests since the underlying JSON is
// only updated on deploy. Bust on TTL or process restart.
const MANIFEST_TTL_MS = 5 * 60 * 1000;
let cached: { computedAt: number; manifest: Manifest } | null = null;

interface ManifestEntry {
  tier: Tier;
  etag: string;
  questionCount: number;
  bytes: number;
  downloadUrl: string;
}

interface Manifest {
  generatedAt: string;
  tiers: ManifestEntry[];
}

async function collectTier(tier: Tier): Promise<unknown[]> {
  const files = (await fs.readdir(QUESTIONS_DIR)).filter((f) => f.endsWith(".json"));
  const all: unknown[] = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(QUESTIONS_DIR, file), "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown[]>;
    const tierQuestions = parsed[tier];
    if (Array.isArray(tierQuestions)) all.push(...tierQuestions);
  }
  return all;
}

async function buildManifest(): Promise<Manifest> {
  const tiers: ManifestEntry[] = [];
  for (const tier of TIERS) {
    const data = await collectTier(tier);
    const json = JSON.stringify(data);
    const etag = crypto
      .createHash("sha256")
      .update(json)
      .digest("hex")
      .slice(0, 16);  // 64-bit prefix is plenty for cache-busting
    tiers.push({
      tier,
      etag,
      questionCount: data.length,
      bytes: Buffer.byteLength(json, "utf-8"),
      downloadUrl: `/api/question-packs/${tier}`,
    });
  }
  return { generatedAt: new Date().toISOString(), tiers };
}

export async function GET() {
  try {
    const now = Date.now();
    if (!cached || now - cached.computedAt > MANIFEST_TTL_MS) {
      cached = { computedAt: now, manifest: await buildManifest() };
    }
    return NextResponse.json(cached.manifest, {
      headers: {
        "Cache-Control": "public, max-age=300",  // 5 min CDN/browser cache
      },
    });
  } catch (err) {
    console.error("[question-packs/manifest] Failed:", err);
    return NextResponse.json(
      { error: "Failed to build manifest", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
