import crypto from "crypto";
import { db, analyticsEvents } from "@/lib/db";

type EventName =
  | "page_view"
  | "session_start"
  | "session_end"
  | "feature_use"
  | "quiz_start"
  | "quiz_complete"
  | "feedback_prompt_shown"
  | "feedback_submitted"
  | "drop_off";

interface TrackEventOptions {
  userId?: string | null;
  event: EventName;
  page?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track an analytics event (server-side, first-party).
 * Non-blocking — errors are logged but never thrown.
 */
export async function trackEvent({ userId, event, page, metadata }: TrackEventOptions) {
  try {
    await db.insert(analyticsEvents).values({
      id: crypto.randomUUID(),
      userId: userId || null,
      event,
      page: page || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (error) {
    console.error("[ANALYTICS] Failed to track event:", error);
  }
}
