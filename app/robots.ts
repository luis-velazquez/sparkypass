import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/profile/",
          "/settings/",
          "/review/",
          "/daily/",
          "/friends/",
          "/power-grid/",
          "/power-ups/",
          "/circuit-breaker/",
          "/watts/",
          "/verify-email/",
          "/forgot-password/",
          "/reset-password/",
        ],
      },
    ],
    sitemap: "https://sparkypass.com/sitemap.xml",
  };
}
