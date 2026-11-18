// /unsubscribe — the link in every offer email's footer. Opening it changes
// nothing (link scanners open every link); the button does. Confirm posts to
// /api/email/unsubscribe, which redirects back here with ?done=1.

import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Unsubscribe | SparkyPass",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; t?: string; done?: string; error?: string; sample?: string }>;
}) {
  const { u, t, done, error, sample } = await searchParams;
  const valid = !!u && !!t;

  let title = "Unsubscribe from offer emails";
  let body: React.ReactNode;
  if (done) {
    title = "You're unsubscribed";
    body = (
      <>
        <p>You won&apos;t get any more offer emails from SparkyPass.</p>
        <p lang="es">Ya no recibirás más correos de ofertas de SparkyPass.</p>
        <p className="text-sm">
          Emails about your account, like sign-in codes, still come when you ask for them.
        </p>
      </>
    );
  } else if (error || sample || !valid) {
    title = "This link doesn't work";
    body = (
      <>
        <p>
          Open the unsubscribe link from the email again, or write to{" "}
          <a className="underline" href="mailto:support@sparkypass.com">
            support@sparkypass.com
          </a>{" "}
          and we&apos;ll take you off the list.
        </p>
        <p lang="es">
          Abre otra vez el enlace del correo, o escríbenos a support@sparkypass.com y te
          daremos de baja.
        </p>
      </>
    );
  } else {
    body = (
      <form method="post" action="/api/email/unsubscribe" className="space-y-4">
        <input type="hidden" name="u" value={u} />
        <input type="hidden" name="t" value={t} />
        <input type="hidden" name="source" value="page" />
        <p>Stop getting offer emails from SparkyPass, like the $0.99 first month?</p>
        <p lang="es">¿Dejar de recibir correos de ofertas de SparkyPass?</p>
        <button
          type="submit"
          className="rounded-md bg-amber px-5 py-2.5 font-semibold text-stone-950 hover:opacity-90"
        >
          Unsubscribe · Darme de baja
        </button>
      </form>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-cream dark:bg-stone-950">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <Zap className="h-10 w-10 text-amber" />
            </Link>
            <h1 className="text-2xl font-bold font-display leading-tight">{title}</h1>
          </CardHeader>
          <CardContent className="space-y-3 text-center text-muted-foreground">{body}</CardContent>
        </Card>
      </div>
    </div>
  );
}
