import { NextResponse, after } from "next/server";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import { db, users, friendships, crewInviteEmails } from "@/lib/db";
import { crewDisplayName, findFriendship, getOrCreateCrewCode, hashEmail } from "@/lib/crew";
import { sendCrewInviteEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { APP_STORE_URL } from "@/lib/site";

// POST /api/friends/request { email } — add someone to your Throne Room crew
// by email. The reply is the same whether or not the address has an account,
// so this can't be used to find out who uses SparkyPass:
//   - an account: a pending request they accept in the Throne Room (or, if
//     they had already asked you, you're crew right away);
//   - no account: an invite email with your crew code and the App Store link,
//     at most INVITES_PER_DAY per sender and one per address per COOLDOWN.
// The invite email goes out after the response, so the timing doesn't give
// the answer away either.
//   200 { success: true, message: "Request sent" }
//   400 invalid email / your own email · 429 too many requests

const INVITES_PER_DAY = 10;
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requestLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

const sent = () => NextResponse.json({ success: true, message: "Request sent" });

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    if (!requestLimiter.check(userId).success) {
      return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    const [currentUser] = await db
      .select({ email: users.email, username: users.username, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (currentUser.email?.toLowerCase() === normalizedEmail) {
      return NextResponse.json({ error: "That's your own email" }, { status: 400 });
    }

    const [addressee] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
      .limit(1);

    if (!addressee) {
      const inviterName = crewDisplayName(currentUser.username, currentUser.name);
      after(() => sendInviteIfAllowed(userId, inviterName, normalizedEmail));
      return sent();
    }

    const existing = await findFriendship(userId, addressee.id);
    if (!existing) {
      await db.insert(friendships).values({
        id: uuidv4(),
        requesterId: userId,
        addresseeId: addressee.id,
        status: "pending",
      });
      return sent();
    }
    if (existing.status === "accepted" || existing.status === "blocked") {
      // Already crew, or blocked: nothing changes, and a block isn't revealed.
      return sent();
    }
    if (existing.status === "pending") {
      // They had already asked you: both want it, so you're crew now.
      if (existing.addresseeId === userId) {
        await db
          .update(friendships)
          .set({ status: "accepted", updatedAt: new Date() })
          .where(eq(friendships.id, existing.id));
      }
      return sent();
    }
    // Declined before: ask again.
    await db
      .update(friendships)
      .set({ requesterId: userId, addresseeId: addressee.id, status: "pending", updatedAt: new Date() })
      .where(eq(friendships.id, existing.id));
    return sent();
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** The invite email for an address with no account, within the caps. */
async function sendInviteIfAllowed(inviterId: string, inviterName: string, email: string) {
  try {
    const now = Date.now();
    const emailHash = hashEmail(email);
    const [{ n: sentToday }] = await db
      .select({ n: count() })
      .from(crewInviteEmails)
      .where(
        and(
          eq(crewInviteEmails.inviterId, inviterId),
          gt(crewInviteEmails.sentAt, new Date(now - DAY_MS)),
        ),
      );
    if (sentToday >= INVITES_PER_DAY) return;
    const [{ n: recent }] = await db
      .select({ n: count() })
      .from(crewInviteEmails)
      .where(
        and(
          eq(crewInviteEmails.emailHash, emailHash),
          gt(crewInviteEmails.sentAt, new Date(now - COOLDOWN_MS)),
        ),
      );
    if (recent > 0) return;

    const code = await getOrCreateCrewCode(inviterId);
    await db.insert(crewInviteEmails).values({
      id: uuidv4(),
      inviterId,
      emailHash,
      sentAt: new Date(now),
    });
    await sendCrewInviteEmail(email, inviterName, code, APP_STORE_URL);
  } catch (error) {
    console.error("Error sending crew invite email:", error);
  }
}
