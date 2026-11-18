import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrCreateCrewCode, resetCrewCode } from "@/lib/crew";
import { rateLimit } from "@/lib/rate-limit";

// GET  /api/friends/code — the user's Throne Room crew code (made on first use).
// POST /api/friends/code { action: "reset" } — a new code; the old one stops
//      working. The crew itself doesn't change.
const resetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const code = await getOrCreateCrewCode(session.user.id);
    return NextResponse.json({ code });
  } catch (error) {
    console.error("Error fetching crew code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    if (body?.action !== "reset") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!resetLimiter.check(session.user.id).success) {
      return NextResponse.json({ error: "Too many resets. Try again later." }, { status: 429 });
    }
    const code = await resetCrewCode(session.user.id);
    return NextResponse.json({ code });
  } catch (error) {
    console.error("Error resetting crew code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
