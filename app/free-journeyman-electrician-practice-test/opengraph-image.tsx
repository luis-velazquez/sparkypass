import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Free journeyman electrician practice test — 60 NEC questions with explanations";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Free practice tests",
    title: "Free journeyman electrician practice test.",
    subtitle: "60 NEC questions in three 20-question tests. Every answer explained with the 2023 and 2026 code section. No signup.",
    footer: "No signup required",
  });
}
