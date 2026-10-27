import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact & Support",
  description:
    "Questions about the SparkyPass app, your subscription, or a practice question? Send us a message and we'll get back to you.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
