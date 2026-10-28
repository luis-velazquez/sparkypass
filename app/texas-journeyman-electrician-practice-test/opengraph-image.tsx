import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Texas journeyman electrician practice test and TDLR exam guide";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Texas · TDLR · 2026 NEC",
    title: "Texas journeyman electrician exam guide.",
    subtitle: "Two-part exam, 70% to pass each portion, open book on the 2026 NEC. Verified against TDLR and the PSI bulletin, plus 60 free practice questions.",
    footer: "Free practice questions",
  });
}
