import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, friendships } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";

// PATCH — Accept, decline, or block a friend request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: friendshipId } = await params;
    const { action } = await request.json();
    const userId = session.user.id;

    if (!["accept", "decline", "block"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Find the friendship
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId))
      .limit(1);

    if (!friendship) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    // Only the addressee can accept/decline. Either party can block.
    if (action === "accept" || action === "decline") {
      if (friendship.addresseeId !== userId) {
        return NextResponse.json({ error: "Only the recipient can accept or decline" }, { status: 403 });
      }
      if (friendship.status !== "pending") {
        return NextResponse.json({ error: "This request is no longer pending" }, { status: 400 });
      }
    }

    if (action === "block") {
      if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    const statusMap: Record<string, "accepted" | "declined" | "blocked"> = {
      accept: "accepted",
      decline: "declined",
      block: "blocked",
    };

    await db
      .update(friendships)
      .set({
        status: statusMap[action],
        updatedAt: new Date(),
      })
      .where(eq(friendships.id, friendshipId));

    return NextResponse.json({ success: true, status: statusMap[action] });
  } catch (error) {
    console.error("Error updating friendship:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Remove a friendship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: friendshipId } = await params;
    const userId = session.user.id;

    // Find the friendship
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId))
      .limit(1);

    if (!friendship) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    // Either party can remove the friendship
    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.delete(friendships).where(eq(friendships.id, friendshipId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting friendship:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
