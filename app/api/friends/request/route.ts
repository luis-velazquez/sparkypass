import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, friendships } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userId = session.user.id;

    // Cannot friend yourself
    const [currentUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (currentUser?.email?.toLowerCase() === normalizedEmail) {
      return NextResponse.json({ error: "You cannot send a friend request to yourself" }, { status: 400 });
    }

    // Find addressee by email (privacy: only return found/not found)
    const [addressee] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!addressee) {
      return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
    }

    // Check for existing friendship in either direction
    const existing = await db
      .select({ id: friendships.id, status: friendships.status })
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, addressee.id),
          ),
          and(
            eq(friendships.requesterId, addressee.id),
            eq(friendships.addresseeId, userId),
          ),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const friendship = existing[0];
      if (friendship.status === "accepted") {
        return NextResponse.json({ error: "You are already friends" }, { status: 400 });
      }
      if (friendship.status === "pending") {
        return NextResponse.json({ error: "A friend request already exists" }, { status: 400 });
      }
      if (friendship.status === "blocked") {
        return NextResponse.json({ error: "Unable to send friend request" }, { status: 400 });
      }
      // If declined, allow re-requesting by updating the existing record
      await db
        .update(friendships)
        .set({
          requesterId: userId,
          addresseeId: addressee.id,
          status: "pending",
          updatedAt: new Date(),
        })
        .where(eq(friendships.id, friendship.id));

      return NextResponse.json({ success: true, message: "Friend request sent" });
    }

    // Create new friendship request
    await db.insert(friendships).values({
      id: uuidv4(),
      requesterId: userId,
      addresseeId: addressee.id,
      status: "pending",
    });

    return NextResponse.json({ success: true, message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
