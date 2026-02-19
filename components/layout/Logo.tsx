"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Zap } from "lucide-react";

export function Logo() {
  const { data: session } = useSession();
  const href = session ? "/dashboard" : "/";

  return (
    <Link href={href} className="flex items-center gap-2">
      <Zap className="h-7 w-7 text-amber dark:hidden" />
      <Image src="/lightning-bolt.svg" alt="SparkyPass" width={28} height={28} className="hidden dark:block" />
      <span className="text-xl font-bold text-foreground">SparkyPass</span>
    </Link>
  );
}
