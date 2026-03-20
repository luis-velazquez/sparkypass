// NextAuth.js configuration for SparkyPass
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
              trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
