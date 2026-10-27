import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

interface PageMeta {
  title: string;
  description: string;
  /** Path beginning with "/" — becomes the canonical URL. */
  path: string;
  /** Use the literal title without the "| SparkyPass" template. */
  absoluteTitle?: boolean;
  /**
   * Open Graph image route. Next.js replaces a parent's `openGraph` object
   * wholesale when a child segment defines one, which drops the file-based
   * image inherited from app/opengraph-image.tsx — so every page names its
   * image explicitly. Defaults to the site-wide card.
   */
  ogImage?: string;
  ogImageAlt?: string;
}

const DEFAULT_OG_ALT = "SparkyPass — electrician exam prep app for the NEC";

/**
 * Builds complete per-page metadata so siteName, canonical, Twitter card and
 * the share image stay consistent on every page.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle,
  ogImage = "/opengraph-image",
  ogImageAlt = DEFAULT_OG_ALT,
}: PageMeta): Metadata {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const image = { url: ogImage, width: 1200, height: 630, alt: ogImageAlt };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url,
      title: fullTitle,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

/** Serialises JSON-LD safely for a <script type="application/ld+json"> tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
