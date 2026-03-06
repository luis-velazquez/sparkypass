import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        name: users.name,
        email: users.email,
        username: users.username,
        authProvider: users.authProvider,
        city: users.city,
        state: users.state,
        dateOfBirth: users.dateOfBirth,
        targetExamDate: users.targetExamDate,
        newsletterOptedIn: users.newsletterOptedIn,
        showHintsOnMaster: users.showHintsOnMaster,
        questionsPerQuiz: users.questionsPerQuiz,
        focusMode: users.focusMode,
        necYear: users.necYear,
        wattsBalance: users.wattsBalance,
        wattsLifetime: users.wattsLifetime,
        createdAt: users.createdAt,
        trialEndsAt: users.trialEndsAt,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPeriodEnd: users.subscriptionPeriodEnd,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      username: user.username,
      authProvider: user.authProvider,
      city: user.city,
      state: user.state,
      dateOfBirth: user.dateOfBirth?.toISOString() || null,
      targetExamDate: user.targetExamDate?.toISOString() || null,
      newsletterOptedIn: user.newsletterOptedIn,
      showHintsOnMaster: user.showHintsOnMaster,
      questionsPerQuiz: user.questionsPerQuiz,
      focusMode: user.focusMode || null,
      necYear: user.necYear,
      wattsBalance: user.wattsBalance ?? 0,
      wattsLifetime: user.wattsLifetime ?? 0,
      createdAt: user.createdAt?.toISOString() || null,
      trialEndsAt: user.trialEndsAt?.toISOString() || null,
      subscriptionStatus: user.subscriptionStatus || null,
      subscriptionPeriodEnd: user.subscriptionPeriodEnd?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetExamDate, newsletterOptedIn, showHintsOnMaster, questionsPerQuiz, focusMode, necYear, hasSeenOnboarding, hasSeenTour } = body;

    // Build update object with only provided fields
    const updateData: {
      targetExamDate?: Date | null;
      newsletterOptedIn?: boolean;
      showHintsOnMaster?: boolean;
      questionsPerQuiz?: number;
      focusMode?: string | null;
      necYear?: string;
      hasSeenOnboarding?: boolean;
      hasSeenTour?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    // Handle targetExamDate update
    if (targetExamDate !== undefined) {
      if (targetExamDate === null) {
        updateData.targetExamDate = null;
      } else {
        const examDate = new Date(targetExamDate);
        if (isNaN(examDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid target exam date" },
            { status: 400 }
          );
        }
        updateData.targetExamDate = examDate;
      }
    }

    // Handle newsletterOptedIn update
    if (newsletterOptedIn !== undefined) {
      updateData.newsletterOptedIn = Boolean(newsletterOptedIn);
    }

    // Handle showHintsOnMaster update
    if (showHintsOnMaster !== undefined) {
      updateData.showHintsOnMaster = Boolean(showHintsOnMaster);
    }

    // Handle questionsPerQuiz update
    if (questionsPerQuiz !== undefined) {
      const val = Number(questionsPerQuiz);
      if (!isNaN(val) && val >= 0) {
        updateData.questionsPerQuiz = val;
      }
    }

    // Handle focusMode update
    if (focusMode !== undefined) {
      updateData.focusMode = focusMode === "journeyman" || focusMode === "master" ? focusMode : null;
    }

    // Handle necYear update
    if (necYear !== undefined) {
      if (necYear === "2023" || necYear === "2026") {
        updateData.necYear = necYear;
      }
    }

    // Handle hasSeenOnboarding update
    if (hasSeenOnboarding !== undefined) {
      updateData.hasSeenOnboarding = Boolean(hasSeenOnboarding);
    }

    // Handle hasSeenTour update
    if (hasSeenTour !== undefined) {
      updateData.hasSeenTour = Boolean(hasSeenTour);
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to complete your profile" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, dateOfBirth, city, state, targetExamDate, newsletterOptedIn } = body;

    // Validate username
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return NextResponse.json(
        { error: "Username must be between 3 and 30 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, underscores, and hyphens" },
        { status: 400 }
      );
    }

    // Check username uniqueness
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, trimmedUsername))
      .limit(1);

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Validate required fields
    if (!dateOfBirth) {
      return NextResponse.json(
        { error: "Date of birth is required" },
        { status: 400 }
      );
    }

    if (!city || typeof city !== "string" || city.trim().length === 0) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }

    if (!state || typeof state !== "string" || state.trim().length === 0) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }

    if (!targetExamDate) {
      return NextResponse.json(
        { error: "Target exam date is required" },
        { status: 400 }
      );
    }

    // Parse and validate dates
    const dob = new Date(dateOfBirth);
    const examDate = new Date(targetExamDate);

    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { error: "Invalid date of birth" },
        { status: 400 }
      );
    }

    if (isNaN(examDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid target exam date" },
        { status: 400 }
      );
    }

    // Validate date of birth (must be at least 18 years old)
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    if (dob > eighteenYearsAgo) {
      return NextResponse.json(
        { error: "You must be at least 18 years old" },
        { status: 400 }
      );
    }

    // Validate target exam date (must be in the future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (examDate < today) {
      return NextResponse.json(
        { error: "Target exam date must be in the future" },
        { status: 400 }
      );
    }

    // Update user profile
    await db
      .update(users)
      .set({
        username: trimmedUsername,
        dateOfBirth: dob,
        city: city.trim(),
        state: state.trim(),
        targetExamDate: examDate,
        newsletterOptedIn: Boolean(newsletterOptedIn),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
