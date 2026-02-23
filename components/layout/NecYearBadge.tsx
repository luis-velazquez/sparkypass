"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function NecYearBadge() {
  const { status } = useSession();
  const [necYear, setNecYear] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.necYear) {
          setNecYear(data.necYear);
        }
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "2023" || detail === "2026") {
        setNecYear(detail);
      }
    };
    window.addEventListener("nec-year-updated", handler);
    return () => window.removeEventListener("nec-year-updated", handler);
  }, []);

  if (status !== "authenticated" || necYear === null) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber/10 text-amber text-sm font-semibold">
      {necYear} NEC
    </div>
  );
}
