import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

interface OgProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer?: string;
}

/**
 * Shared Open Graph card. Dark stone ground with the amber tri-bolt mark —
 * the same look as the app icon and the app's dark mode.
 */
export async function renderOg({ eyebrow, title, subtitle, footer = "Free on the App Store" }: OgProps) {
  const root = process.cwd();
  const [outfitBold, outfitMedium, mono, mark] = await Promise.all([
    readFile(join(root, "assets/fonts/Outfit-ExtraBold.ttf")),
    readFile(join(root, "assets/fonts/Outfit-Medium.ttf")),
    readFile(join(root, "assets/fonts/SpaceMono-Bold.ttf")),
    readFile(join(root, "public/sparkypass-icon-gradient.svg")),
  ]);
  const markUri = `data:image/svg+xml;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #1C1917 0%, #292524 100%)",
          color: "#FAFAF9",
          fontFamily: "Outfit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markUri} width={72} height={72} alt="" />
          <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>SparkyPass</span>
          <span
            style={{
              marginLeft: 16,
              fontFamily: "Space Mono",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#F59E0B",
            }}
          >
            {eyebrow}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}>
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>{title}</div>
          <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.35, color: "#D6D3D1" }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Space Mono", fontSize: 22, fontWeight: 700 }}>
          <span
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              background: "#F59E0B",
              color: "#1C1917",
            }}
          >
            {footer}
          </span>
          <span style={{ color: "#A8A29E" }}>550+ NEC questions · 2023 &amp; 2026 editions</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Outfit", data: outfitBold, weight: 800, style: "normal" },
        { name: "Outfit", data: outfitMedium, weight: 500, style: "normal" },
        { name: "Space Mono", data: mono, weight: 700, style: "normal" },
      ],
    },
  );
}
