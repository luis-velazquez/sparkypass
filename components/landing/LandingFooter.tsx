import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border dark:border-stone-800 bg-card dark:bg-stone-950">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & tagline */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <img
                src="/sparkypass-icon-orange.svg"
                alt="SparkyPass"
                className="w-5 h-5"
              />
              <span className="font-bold text-foreground">SparkyPass</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Gamified Texas Master Electrician exam prep
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SparkyPass. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
