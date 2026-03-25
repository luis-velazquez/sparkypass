import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";

const VALID_EVENTS = [
  "page_view",
  "feature_use",
  "quiz_start",
  "quiz_complete",
  "feedback_prompt_shown",
  "feedback_submitted",
  "drop_off",
] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { event, page, metadata } = body;

    if (!event || !VALID_EVENTS.includes(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    await trackEvent({
      userId: session?.user?.id || null,
      event,
      page: typeof page === "string" ? page.slice(0, 500) : undefined,
      metadata: typeof metadata === "object" && metadata !== null ? metadata : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never fail client-side
  }
}
