import Link from "next/link";
import { AppStoreBadge } from "@/components/site/AppStoreBadge";
import {
  APPLE_LEGAL,
  APP_STORE_URL,
  LEGAL_ENTITY,
  MIN_IOS,
  NFPA_DISCLAIMER,
  PRACTICE_HUB_PATH,
  SUPPORT_EMAIL,
} from "@/lib/site";

const PRODUCT_LINKS = [
  { href: PRACTICE_HUB_PATH, label: "Free journeyman practice tests" },
  { href: `${PRACTICE_HUB_PATH}/test-1`, label: "Practice test 1" },
  { href: `${PRACTICE_HUB_PATH}/test-2`, label: "Practice test 2" },
  { href: `${PRACTICE_HUB_PATH}/test-3`, label: "Practice test 3" },
  { href: "/texas-journeyman-electrician-practice-test", label: "Texas journeyman exam guide" },
  { href: "/#features", label: "Features" },
  { href: "/#pro", label: "SparkyPass Pro" },
];

const COMPANY_LINKS = [
  { href: "/contact", label: "Contact & support" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
  { href: "/dmca", label: "DMCA" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-cream-dark">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG */}
              <img src="/sparkypass-icon-orange.svg" alt="" aria-hidden="true" className="h-7 w-7" />
              <span className="font-display text-xl font-bold tracking-tight">SparkyPass</span>
            </div>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-stone-600">
              Electrician exam prep for iPhone. NEC practice questions explained answer by answer,
              load calculators, and study games. Requires iOS {MIN_IOS} or later.
            </p>
            <div className="-ml-3 mt-4">
              <AppStoreBadge height={44} placement="footer" />
            </div>
          </div>

          <nav aria-label="Product">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">Product</h2>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] font-medium text-stone-700 hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={APP_STORE_URL} rel="noopener" className="text-[15px] font-medium text-stone-700 hover:text-foreground">
                  View on the App Store
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">Company</h2>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] font-medium text-stone-700 hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[15px] font-medium text-stone-700 hover:text-foreground">
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 space-y-3 border-t border-border pt-8 text-[13px] leading-relaxed text-stone-600">
          <p>{NFPA_DISCLAIMER}</p>
          <p>{APPLE_LEGAL}</p>
          <p>
            &copy; {new Date().getFullYear()} {LEGAL_ENTITY}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
