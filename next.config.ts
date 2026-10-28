import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const PRACTICE_HUB = "/free-journeyman-electrician-practice-test";

/**
 * Retired web-app URLs. The iPhone app owns these experiences now; every old
 * public URL 308s to the closest promotional page so indexed links and old
 * bookmarks keep working. `/api/*` is deliberately absent — the app's API base.
 */
const RETIRED_TO_HOME = [
  "/login",
  "/register",
  "/register/profile",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/dashboard",
  "/profile",
  "/settings",
  "/bookmarks",
  "/bookmarks/:path*",
  "/friends",
  "/power-grid",
  "/power-grid/:path*",
  "/power-ups",
  "/watts",
  "/tips",
  "/daily",
  "/review",
  "/circuit-breaker",
  "/circuit-breaker/:path*",
  "/index-sniper",
  "/index-game",
  "/translation-engine",
  "/formula-builder",
  "/apprentice/:path*",
  "/admin/:path*",
  "/beta-agreement",
  "/changelog",
  "/known-issues",
  "/acceptable-use",
  "/status",
  "/leaderboard",
];

const RETIRED_TO_PRACTICE = ["/quiz", "/quiz/:path*", "/mock-exam", "/mock-exam/:path*", "/flashcards", "/flashcards/:path*"];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    },
  ],
  redirects: async () => [
    ...RETIRED_TO_HOME.map((source) => ({ source, destination: "/", permanent: true })),
    ...RETIRED_TO_PRACTICE.map((source) => ({ source, destination: PRACTICE_HUB, permanent: true })),
    { source: "/pricing", destination: "/#pro", permanent: true },
    { source: "/load-calculator", destination: "/#features", permanent: true },
    { source: "/load-calculator/:path*", destination: "/#features", permanent: true },
  ],
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload logs during build
  silent: true,

  // Upload source maps for better stack traces
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps when auth token is available
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
