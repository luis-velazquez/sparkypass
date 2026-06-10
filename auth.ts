// NextAuth.js configuration for SparkyPass
import NextAuth, { type Session } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getMobileSession } from "@/lib/auth-mobile";
import { TRIAL_PERIOD_MS } from "@/lib/subscription";

const nextAuth = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Email + password login
        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] Missing email or password");
          return null;
        }

        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.passwordHash) {
          console.log("[auth] User not found or no password hash for:", email);
          return null;
        }

        // Verify password
        try {
          const isValidPassword = await compare(password, user.passwordHash);
          if (!isValidPassword) {
            console.log("[auth] Invalid password for:", email);
            return null;
          }
        } catch (err) {
          console.error("[auth] bcrypt compare error:", err);
          return null;
        }

        // Restore-on-sign-in (web): a soft-deleted user who provides valid
        // credentials within the 30-day grace gets their account un-deleted.
        // Same policy as mobile email + OAuth same-provider restore.
        if (user.deletedAt) {
          console.log("[auth] Restoring soft-deleted user on sign-in:", email);
          await db
            .update(users)
            .set({ deletedAt: null, updatedAt: new Date() })
            .where(eq(users.id, user.id));
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    newUser: "/register/profile",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") {
        try {
          // Handle OAuth sign-in
          const email = user.email?.toLowerCase();
          if (!email) {
            console.error("[auth] OAuth sign-in: no email provided");
            return false;
          }

          // Check if user exists
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          // Restore-on-sign-in (web OAuth): same-credential return within the
          // 30-day grace clears deleted_at. Mirrors the mobile resolveOAuthUser
          // restore path. Different-provider sign-in for a soft-deleted email
          // is NOT supported here (single Google provider in web v1).
          if (existingUser?.deletedAt) {
            console.log("[auth] Restoring soft-deleted user on OAuth sign-in:", email);
            await db
              .update(users)
              .set({ deletedAt: null, updatedAt: new Date() })
              .where(eq(users.id, existingUser.id));
            user.id = existingUser.id;
            return true;
          }

          if (!existingUser) {
            // Create new user for OAuth
            const newUserId = crypto.randomUUID();
            console.log("[auth] Creating OAuth user:", email, account?.provider);
            await db.insert(users).values({
              id: newUserId,
              email: email,
              name: user.name || "User",
              authProvider: account?.provider as "google" | "facebook" | "apple",
              emailVerified: true,
              trialEndsAt: new Date(Date.now() + TRIAL_PERIOD_MS),
              subscriptionStatus: "trialing",
            });
            user.id = newUserId;
            console.log("[auth] OAuth user created:", newUserId);
          } else {
            user.id = existingUser.id;
            console.log("[auth] OAuth user exists:", existingUser.id);
          }
        } catch (err) {
          console.error("[auth] OAuth signIn callback error:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // Mark OAuth users as verified immediately (no need to wait for DB read)
        if (account?.provider && account.provider !== "credentials") {
          token.isEmailVerified = true;
        }
      }

      // Fetch fresh user data for profile completion status
      if (token.id) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);

        if (dbUser) {
          // Soft-deleted user: invalidate the token so the session callback
          // returns null and the user is effectively logged out. Done by
          // clearing the id; the session callback returns Session shape with
          // user.id = "" which downstream code treats as unauthenticated.
          if (dbUser.deletedAt) {
            return {};  // empty token = no session
          }
          token.profileComplete = Boolean(
            dbUser.username && dbUser.city && dbUser.state && dbUser.dateOfBirth
          );
          token.isEmailVerified = dbUser.emailVerified;
          token.subscriptionStatus = (dbUser.subscriptionStatus as "trialing" | "active" | "past_due" | "canceled" | "expired") ?? null;
          token.trialEndsAt = dbUser.trialEndsAt?.toISOString() ?? null;
          token.subscriptionPeriodEnd = dbUser.subscriptionPeriodEnd?.toISOString() ?? null;
        } else if (!token.isEmailVerified) {
          // User not found in DB — keep existing token values
          token.profileComplete = false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          profileComplete: (token.profileComplete as boolean) ?? false,
          isEmailVerified: (token.isEmailVerified as boolean) ?? false,
          subscriptionStatus: token.subscriptionStatus ?? null,
          trialEndsAt: token.trialEndsAt ?? null,
          subscriptionPeriodEnd: token.subscriptionPeriodEnd ?? null,
        },
      };
    },
  },
});

// NextAuth provides handlers/signIn/signOut as-is; auth() is wrapped below so
// it transparently accepts a mobile Bearer token in the Authorization header
// AND the existing NextAuth session cookie. Every route that does
// `import { auth } from "@/auth"` gets mobile support without code changes.
export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;
const _nextAuthSession = nextAuth.auth;

/**
 * Resolve the current request's session. Checks the `Authorization: Bearer ...`
 * header first (mobile clients), then falls back to the NextAuth cookie (web).
 *
 * Mobile path: see lib/auth-mobile.ts. Tokens are short-lived JWTs signed with
 * MOBILE_JWT_SECRET; soft-deleted users are rejected at this layer.
 *
 * Web path: unchanged — delegates to NextAuth's JWT session resolution.
 *
 * Note: only the zero-arg `await auth()` shape is wrapped. NextAuth's other
 * call shapes (request wrapping, middleware) are not used in this codebase
 * (verified by grep — middleware.ts uses `getToken`, not `auth`).
 */
export async function auth(): Promise<Session | null> {
  try {
    const h = await headers();
    const authz = h.get("authorization");
    if (authz && authz.toLowerCase().startsWith("bearer ")) {
      const token = authz.slice(7).trim();
      if (token) {
        const mobileSession = await getMobileSession(token);
        if (mobileSession) {
          // MobileSession is shaped to match the Session augmentation in types/.
          // Cast through unknown because TS can't narrow NextAuth's overload here.
          return mobileSession as unknown as Session;
        }
      }
    }
  } catch {
    // headers() can throw outside a request scope (build-time, certain server
    // actions). Fall through to the cookie-based session.
  }
  // _nextAuthSession is overloaded; the no-arg call returns Session | null.
  return (await _nextAuthSession()) as Session | null;
}
