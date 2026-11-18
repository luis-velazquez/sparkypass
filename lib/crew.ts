import { randomInt, createHash } from "crypto";
import { and, eq, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db, crewCodes, friendships } from "@/lib/db";

// Throne Room crews. A crew is the user plus their accepted friendships.
// Three ways in:
//   - a crew code: every user has one; entering someone's code makes you crew
//     at once (they shared it on purpose, by text or in person);
//   - an email: if it belongs to an account, a pending request they accept;
//     if not, an invite email with the sender's crew code (rate-limited);
//   - accepting a pending request.
// Friends see only the basics: a display name and Throne Room stats.

// No look-alikes (0/O, 1/I/L), so a code read aloud or typed from a text
// can't be misread. 31^6 ≈ 887 million codes.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CREW_CODE_LENGTH = 6;

export function newCrewCode(): string {
  let out = "";
  for (let i = 0; i < CREW_CODE_LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** What a person typed → the stored form: upper case, separators dropped. */
export function normalizeCrewCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** The friend-facing name: the username, else the first word of the account
 *  name (never the full name), else a generic one. */
export function crewDisplayName(username: string | null, name: string | null): string {
  const u = username?.trim();
  if (u) return u;
  const first = name?.trim().split(/\s+/)[0];
  return first || "Electrician";
}

export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/** The user's crew code, created on first use. Retries on the (rare) clash. */
export async function getOrCreateCrewCode(userId: string): Promise<string> {
  const [row] = await db
    .select({ code: crewCodes.code })
    .from(crewCodes)
    .where(eq(crewCodes.userId, userId))
    .limit(1);
  if (row) return row.code;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCrewCode();
    try {
      await db.insert(crewCodes).values({ userId, code, createdAt: new Date() });
      return code;
    } catch {
      // Either the code clashed (try another) or a parallel call created this
      // user's row first (read it back).
      const [again] = await db
        .select({ code: crewCodes.code })
        .from(crewCodes)
        .where(eq(crewCodes.userId, userId))
        .limit(1);
      if (again) return again.code;
    }
  }
  throw new Error("Could not create a crew code");
}

/** A new code for the user; the old one stops working. Crew stays as is. */
export async function resetCrewCode(userId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCrewCode();
    try {
      const updated = await db
        .update(crewCodes)
        .set({ code, createdAt: new Date() })
        .where(eq(crewCodes.userId, userId))
        .returning({ code: crewCodes.code });
      if (updated.length > 0) return code;
      await db.insert(crewCodes).values({ userId, code, createdAt: new Date() });
      return code;
    } catch {
      // Clash with another user's code: try another.
    }
  }
  throw new Error("Could not reset the crew code");
}

export async function crewCodeOwner(code: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: crewCodes.userId })
    .from(crewCodes)
    .where(eq(crewCodes.code, code))
    .limit(1);
  return row?.userId ?? null;
}

/** The friendship between two users in either direction, if any. */
export async function findFriendship(a: string, b: string) {
  const [row] = await db
    .select({
      id: friendships.id,
      status: friendships.status,
      requesterId: friendships.requesterId,
      addresseeId: friendships.addresseeId,
    })
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
        and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Put two users on each other's crew (a code was redeemed). A block stays a
 *  block; anything else becomes accepted. */
export async function makeCrew(
  redeemerId: string,
  ownerId: string,
): Promise<"added" | "already" | "blocked"> {
  const existing = await findFriendship(redeemerId, ownerId);
  if (existing) {
    if (existing.status === "accepted") return "already";
    if (existing.status === "blocked") return "blocked";
    await db
      .update(friendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(friendships.id, existing.id));
    return "added";
  }
  await db.insert(friendships).values({
    id: uuidv4(),
    requesterId: redeemerId,
    addresseeId: ownerId,
    status: "accepted",
  });
  return "added";
}
