import type { Metadata } from "next";
import { Outfit, Nunito, Space_Mono } from "next/font/google";
import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AuthButtons } from "@/components/layout/AuthButtons";
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
  title: "SparkyPass | Texas Master Electrician Exam Prep",
  description:
    "Pass your Texas Master Electrician exam with SparkyPass. Interactive quizzes, flashcards, and personalized study plans with Sparky your mentor.",
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
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Logo />

            {/* Desktop Navigation */}
            <DesktopNav />

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <AuthButtons />
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle />
              <MobileNav />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber dark:hidden"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
                <img src="/lightning-bolt.svg" alt="SparkyPass" className="w-5 h-5 hidden dark:block" />
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
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
