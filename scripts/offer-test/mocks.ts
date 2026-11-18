/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
// Test doubles: record instead of sending.
export const sentEmails: any[] = ((globalThis as any).__sentEmails ??= []);
export const sentPushes: any[] = ((globalThis as any).__sentPushes ??= []);
export class Resend {
  emails = {
    send: async (payload: any, opts?: any) => {
      if ((globalThis as any).__failFor === payload.to) return { data: null, error: { message: "boom" } };
      sentEmails.push({ ...payload, idempotencyKey: opts?.idempotencyKey });
      return { data: { id: "re_" + sentEmails.length }, error: null };
    },
  };
  constructor(_k?: string) {}
}
export async function sendPushNotifications(messages: any[]) {
  sentPushes.push(...messages);
  return { sent: messages.length, failed: 0, removed: 0 };
}
export async function tokensForUser(userId: string) {
  return userId === "u_d15A" ? ["ExponentPushToken[test]"] : [];
}
