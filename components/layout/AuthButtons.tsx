"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="ghost" className="min-h-[44px]" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (session) {
    return null;
  }

  return (
    <>
      <ThemeToggle />
      <Link href="/login">
        <Button variant="ghost" className="min-h-[44px]">Log in</Button>
      </Link>
      <Link href="/register">
        <Button className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 min-h-[44px]">
          Sign up
        </Button>
      </Link>
    </>
  );
}
