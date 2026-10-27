import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "DMCA & Content Takedown Policy",
  description: "How to report content on SparkyPass that you believe infringes your copyright.",
  path: "/dmca",
});

export default function DmcaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
