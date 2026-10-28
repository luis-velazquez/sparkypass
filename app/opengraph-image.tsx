import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "SparkyPass — electrician exam prep app for the NEC";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Electrician exam prep",
    title: "Pass your journeyman or master electrician exam.",
    subtitle: "Every NEC practice question explained answer by answer, with the code section. Load calculators and study games on iPhone.",
  });
}
