import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "The terms that govern the SparkyPass app and SparkyPass Pro subscription, including billing through the App Store, cancellation, and content ownership.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
