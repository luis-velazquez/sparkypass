// NextAuth.js API route handler
// NOTE: Rate limiting for login (NextAuth credentials) should be handled
// via NextAuth's built-in signIn callback or middleware, not by wrapping
// this route handler. The handlers object is managed by NextAuth internals.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
