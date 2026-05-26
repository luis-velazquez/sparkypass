// Expo Push Notifications — thin HTTP wrapper around Expo's public push API.
// We use direct fetch instead of the expo-server-sdk package to keep the
// dependency surface small (the API is stable and well-documented).
//
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/
//
// On a successful send, Expo returns receipts that may include "DeviceNotRegistered"
// — those tokens should be removed from push_tokens. This wrapper does that
// cleanup inline so the callers (the crons) don't have to manage it.

import { eq, inArray } from "drizzle-orm";
import { db, pushTokens } from "@/lib/db";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const MAX_BATCH = 100;  // Expo's documented per-request limit

export interface PushMessage {
  to: string;                 // ExponentPushToken[xxx]
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoTicketsResponse {
  data?: ExpoTicket[];
  errors?: { message: string }[];
}

/**
 * Send a batch of push notifications. Returns a summary of successes + token
 * cleanups. Errors with individual messages do not abort the whole batch.
 *
 * Tokens that come back with `DeviceNotRegistered` are deleted from the
 * push_tokens table so we stop sending to them (saves Expo quota and avoids
 * compounding errors).
 */
export async function sendPushNotifications(
  messages: PushMessage[],
): Promise<{ sent: number; failed: number; removed: number }> {
  if (messages.length === 0) return { sent: 0, failed: 0, removed: 0 };

  let sent = 0;
  let failed = 0;
  const tokensToRemove = new Set<string>();

  for (let i = 0; i < messages.length; i += MAX_BATCH) {
    const slice = messages.slice(i, i + MAX_BATCH);

    let response: Response;
    try {
      response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(slice),
      });
    } catch (err) {
      console.error("[push] Network error sending batch:", err);
      failed += slice.length;
      continue;
    }

    if (!response.ok) {
      console.error("[push] Non-OK response", response.status, await response.text());
      failed += slice.length;
      continue;
    }

    let payload: ExpoTicketsResponse;
    try {
      payload = (await response.json()) as ExpoTicketsResponse;
    } catch (err) {
      console.error("[push] Failed to parse response JSON:", err);
      failed += slice.length;
      continue;
    }

    const tickets = payload.data ?? [];
    for (let j = 0; j < slice.length; j++) {
      const ticket = tickets[j];
      if (!ticket || ticket.status === "error") {
        failed += 1;
        // DeviceNotRegistered means the token will never be valid again —
        // queue it for removal.
        if (ticket?.details?.error === "DeviceNotRegistered") {
          tokensToRemove.add(slice[j].to);
        }
      } else {
        sent += 1;
      }
    }
  }

  // Clean up dead tokens — single delete by token list. Skip if empty.
  if (tokensToRemove.size > 0) {
    try {
      await db
        .delete(pushTokens)
        .where(inArray(pushTokens.token, Array.from(tokensToRemove)));
    } catch (err) {
      console.error("[push] Failed to clean up dead tokens:", err);
    }
  }

  return { sent, failed, removed: tokensToRemove.size };
}

/**
 * Fetch all push tokens for a list of users. Returns one entry per token
 * (a user with two devices appears twice).
 */
export async function tokensForUsers(
  userIds: string[],
): Promise<Array<{ userId: string; token: string }>> {
  if (userIds.length === 0) return [];
  const rows = await db
    .select({ userId: pushTokens.userId, token: pushTokens.token })
    .from(pushTokens)
    .where(inArray(pushTokens.userId, userIds));
  return rows;
}

/**
 * Fetch tokens for a single user.
 */
export async function tokensForUser(
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));
  return rows.map((r: { token: string }) => r.token);
}
