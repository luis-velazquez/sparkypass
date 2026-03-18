import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, flashcardBookmarks } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";
import { FLASHCARD_SETS } from "@/app/flashcards/flashcards";

// Helper to find flashcard by ID
function getFlashcardById(id: string) {
  for (const set of FLASHCARD_SETS) {
    const card = set.cards.find((c) => c.id === id);
    if (card) {
      return { ...card, setName: set.name };
    }
  }
  return null;
}

// GET - List all flashcard bookmarks for the current user (with flashcard details)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userBookmarks = await db
      .select({
        id: flashcardBookmarks.id,
        flashcardId: flashcardBookmarks.flashcardId,
        createdAt: flashcardBookmarks.createdAt,
      })
      .from(flashcardBookmarks)
      .where(eq(flashcardBookmarks.userId, session.user.id))
      .orderBy(sql`${flashcardBookmarks.createdAt} DESC`);

    // Enrich bookmarks with flashcard details
    const enrichedBookmarks = userBookmarks.map((b: any) => {
      const flashcard = getFlashcardById(b.flashcardId);
      return {
        id: b.id,
        flashcardId: b.flashcardId,
        front: flashcard?.front || null,
        back: flashcard?.back || null,
        necReference: flashcard?.necReference || null,
        setName: flashcard?.setName || null,
        createdAt: b.createdAt?.toISOString() || null,
      };
    });

    return NextResponse.json({
      bookmarks: enrichedBookmarks,
    });
  } catch (error) {
    console.error("Error fetching flashcard bookmarks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a new flashcard bookmark
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { flashcardId } = body;

    if (!flashcardId) {
      return NextResponse.json(
        { error: "Missing required field: flashcardId" },
        { status: 400 }
      );
    }

    // Check if bookmark already exists
    const [existing] = await db
      .select({ id: flashcardBookmarks.id })
      .from(flashcardBookmarks)
      .where(
        and(
          eq(flashcardBookmarks.userId, session.user.id),
          eq(flashcardBookmarks.flashcardId, flashcardId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({
        success: true,
        bookmarkId: existing.id,
        message: "Bookmark already exists",
      });
    }

    // Create new bookmark
    const bookmarkId = crypto.randomUUID();

    await db.insert(flashcardBookmarks).values({
      id: bookmarkId,
      userId: session.user.id,
      flashcardId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      bookmarkId,
    });
  } catch (error) {
    console.error("Error creating flashcard bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a flashcard bookmark by flashcardId
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { flashcardId } = body;

    if (!flashcardId) {
      return NextResponse.json(
        { error: "Missing required field: flashcardId" },
        { status: 400 }
      );
    }

    // Delete bookmark by flashcardId for the current user
    await db
      .delete(flashcardBookmarks)
      .where(
        and(
          eq(flashcardBookmarks.userId, session.user.id),
          eq(flashcardBookmarks.flashcardId, flashcardId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Bookmark removed",
    });
  } catch (error) {
    console.error("Error deleting flashcard bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
