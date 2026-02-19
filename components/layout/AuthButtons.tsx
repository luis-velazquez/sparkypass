"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

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
    return (
      <Button
        variant="outline"
        className="min-h-[44px] gap-2"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden lg:inline">Log out</span>
      </Button>
    );
  }

  return (
    <>
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

export function MobileAuthButtons({ onClose }: { onClose?: () => void }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="outline" className="w-full min-h-[44px]" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (session) {
    return (
      <Button
        variant="outline"
        className="w-full min-h-[44px] gap-2 text-destructive hover:text-destructive"
        onClick={() => {
          onClose?.();
          signOut({ callbackUrl: "/" });
        }}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    );
  }

  return (
    <>
      <Link href="/login" className="w-full" onClick={onClose}>
        <Button variant="outline" className="w-full min-h-[44px]">
          Log in
        </Button>
      </Link>
      <Link href="/register" className="w-full" onClick={onClose}>
        <Button className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 min-h-[44px]">
          Sign up
        </Button>
      </Link>
    </>
  );
}
