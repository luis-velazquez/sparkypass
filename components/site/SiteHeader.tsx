import Link from "next/link";
import { APP_STORE_URL, PRACTICE_HUB_PATH } from "@/lib/site";

const NAV = [
  { href: PRACTICE_HUB_PATH, label: "Free practice tests" },
  { href: "/texas-journeyman-electrician-practice-test", label: "Texas exam" },
  { href: "/#features", label: "Features" },
  { href: "/#pro", label: "Pro" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG */}
          <img src="/sparkypass-icon-orange.svg" alt="" aria-hidden="true" className="h-7 w-7" />
          <span className="font-display text-[19px] font-bold tracking-tight text-foreground">SparkyPass</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[15px] font-semibold text-stone-600 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={PRACTICE_HUB_PATH}
            className="text-[15px] font-semibold text-stone-600 hover:text-foreground md:hidden"
          >
            Free tests
          </Link>
          <a
            href={APP_STORE_URL}
            rel="noopener"
            className="inline-flex h-10 items-center rounded-full bg-amber px-4 text-[15px] font-bold text-stone-900 shadow-glow-primary transition-colors hover:bg-amber-dark"
          >
            Get the app
          </a>
        </div>
      </div>
    </header>
  );
}
