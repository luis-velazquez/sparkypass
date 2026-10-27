import { APP_STORE_URL } from "@/lib/site";

/**
 * Official Apple "Download on the App Store" badge (black, en-US).
 * Apple's marketing guidelines: minimum 40px tall on screen, clear space of at
 * least a quarter of the badge height, never recoloured or animated, one badge
 * per layout. The artwork lives at public/app-store-badge.svg (120×40 units).
 */
export function AppStoreBadge({
  height = 52,
  className = "",
  placement,
}: {
  height?: number;
  className?: string;
  /** Optional analytics-free placement hint, rendered as a data attribute. */
  placement?: string;
}) {
  const width = Math.round(height * 3);
  return (
    <a
      href={APP_STORE_URL}
      className={`inline-flex shrink-0 rounded-[8px] ${className}`}
      style={{ padding: Math.round(height / 4) }}
      data-placement={placement}
      rel="noopener"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG artwork, no optimisation needed */}
      <img
        src="/app-store-badge.svg"
        alt="Download on the App Store"
        width={width}
        height={height}
        style={{ width, height }}
        decoding="async"
      />
    </a>
  );
}
