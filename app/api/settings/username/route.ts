import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq, and, ne } from "drizzle-orm";
import { validateUsername, normalizeUsername } from "@/lib/username";

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, city, state } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Validate username
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      return NextResponse.json(
        { error: usernameCheck.error },
        { status: 400 }
      );
    }

    const trimmed = normalizeUsername(username);

    // Check uniqueness (exclude current user)
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, trimmed), ne(users.id, session.user.id)))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    const trimmedCity = city?.trim() || null;
    const trimmedState = state?.trim() || null;

    await db
      .update(users)
      .set({ name: trimmedName, username: trimmed, city: trimmedCity, state: trimmedState, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, name: trimmedName, username: trimmed, city: trimmedCity, state: trimmedState });
  } catch (error) {
    console.error("Username update error:", error);
    return NextResponse.json(
      { error: "Failed to update username" },
      { status: 500 }
    );
  }
}
