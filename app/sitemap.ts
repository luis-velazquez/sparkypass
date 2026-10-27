import type { MetadataRoute } from "next";
import { CONTENT_UPDATED, PRACTICE_HUB_PATH, SITE_URL } from "@/lib/site";

const lastModified = new Date(CONTENT_UPDATED);

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly",
  ) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1.0, "weekly"),
    page(PRACTICE_HUB_PATH, 0.9, "weekly"),
    page(`${PRACTICE_HUB_PATH}/test-1`, 0.8),
    page(`${PRACTICE_HUB_PATH}/test-2`, 0.8),
    page(`${PRACTICE_HUB_PATH}/test-3`, 0.8),
    page("/texas-journeyman-electrician-practice-test", 0.8),
    page("/contact", 0.4, "yearly"),
    page("/privacy", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
    page("/dmca", 0.1, "yearly"),
  ];
}
