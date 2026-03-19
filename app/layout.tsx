import type { Metadata } from "next";
import { Outfit, Nunito, Space_Mono } from "next/font/google";
import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { SidebarContentWrapper, SidebarTopBar } from "@/components/layout/SidebarContentWrapper";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import { AuthButtons } from "@/components/layout/AuthButtons";
import { UserMenu } from "@/components/layout/UserMenu";
import { HideOnMarketing } from "@/components/layout/AppShell";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "SparkyPass | Texas Master Electrician Exam Prep",
    template: "%s | SparkyPass",
  },
  description:
    "Pass your Texas Master Electrician exam with SparkyPass. Gamified NEC quizzes, mini-games, flashcards, and personalized study plans with Sparky your mentor.",
  metadataBase: new URL("https://sparkypass.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" id="theme-color-meta" content="#ffffff" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var m=document.getElementById('theme-color-meta');
            function u(){m.content=document.documentElement.classList.contains('dark')?'#1c1917':'#ffffff'}
            u();
            new MutationObserver(u).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
          })();
        `}} />
      </head>
      <body
        className={`${outfit.variable} ${nunito.variable} ${spaceMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
        <SessionProvider>
        <SidebarProvider>

        {/* Desktop sidebar (xl+) — hidden on marketing pages */}
        <HideOnMarketing>
          <Sidebar />
        </HideOnMarketing>

        {/* Mobile/tablet header (below xl) — hidden on marketing pages */}
        <HideOnMarketing>
          <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 xl:hidden">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-1">
                <MobileNav />
                <Logo />
              </div>
              <div className="flex items-center gap-2">
                <UserMenu />
                <AuthButtons />
              </div>
            </div>
          </header>
        </HideOnMarketing>

        {/* Desktop top bar (xl+) — hidden on marketing pages */}
        <HideOnMarketing>
          <SidebarTopBar>
            <div className="flex items-center gap-2">
              <UserMenu />
              <AuthButtons />
            </div>
          </SidebarTopBar>
        </HideOnMarketing>

        {/* Main content — shifted right on xl+ */}
        <SidebarContentWrapper>
          <main className="flex-1">{children}</main>

          {/* Footer — only on mobile/tablet for app pages (sidebar has footer on xl+) */}
          <HideOnMarketing>
          <footer className="border-t border-border bg-card xl:hidden">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <img src="/sparkypass-icon-orange.svg" alt="SparkyPass" className="w-5 h-5" />
                  <span className="font-semibold">SparkyPass</span>
                </div>
                <nav className="flex gap-6 text-sm text-muted-foreground">
                  <Link href="/contact" className="hover:text-foreground">
                    Contact
                  </Link>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy
                  </Link>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms
                  </Link>
                </nav>
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} SparkyPass. All rights
                  reserved.
                </p>
              </div>
            </div>
          </footer>
          </HideOnMarketing>
        </SidebarContentWrapper>

        </SidebarProvider>
        </SessionProvider>
        <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
