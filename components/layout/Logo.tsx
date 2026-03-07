"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function Logo() {
  const { data: session } = useSession();
  const href = session ? "/dashboard" : "/";

  return (
    <Link href={href} className="flex items-center gap-2">
      <Image src="/sparkypass-icon-orange.svg" alt="SparkyPass" width={28} height={28} />
      <span className="text-xl font-bold text-foreground">SparkyPass</span>
    </Link>
  );
}
