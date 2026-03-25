"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DMCAPage() {
  return (
    <div className="min-h-screen py-12 px-4 bg-cream dark:bg-stone-950 relative">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="max-w-3xl mx-auto relative z-10">
        <Card className="shadow-lg border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <Zap className="h-10 w-10 text-amber" />
            </Link>
            <CardTitle className="text-2xl font-bold font-display">
              DMCA &amp; Content Takedown Policy
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: March 25, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Overview</h2>
              <p>
                SparkyPass respects the intellectual property rights of others and expects its
                users to do the same. In accordance with the Digital Millennium Copyright Act
                (&ldquo;DMCA&rdquo;), we will respond promptly to claims of copyright infringement
                committed using our platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Reporting Copyright Infringement</h2>
              <p>
                If you believe that content on SparkyPass infringes your copyright, please submit
                a written notification containing the following information:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  A physical or electronic signature of the copyright owner or a person authorized
                  to act on their behalf.
                </li>
                <li>
                  Identification of the copyrighted work claimed to have been infringed.
                </li>
                <li>
                  Identification of the material that is claimed to be infringing, with enough
                  detail so that we can locate it on the platform.
                </li>
                <li>
                  Your contact information, including name, address, telephone number, and email
                  address.
                </li>
                <li>
                  A statement that you have a good faith belief that use of the material in the
                  manner complained of is not authorized by the copyright owner, its agent, or
                  the law.
                </li>
                <li>
                  A statement, made under penalty of perjury, that the above information is
                  accurate and that you are the copyright owner or authorized to act on behalf
                  of the owner.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Designated Agent</h2>
              <p>
                DMCA takedown notices should be sent to our designated agent at:
              </p>
              <div className="rounded-lg bg-muted/50 dark:bg-stone-800/50 border border-border p-4 not-prose">
                <p className="text-sm text-foreground font-medium">SparkyPass DMCA Agent</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Email:{" "}
                  <a href="mailto:dmca@sparkypass.com" className="text-amber hover:text-amber-dark underline">
                    dmca@sparkypass.com
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">
                  Or via our{" "}
                  <Link href="/contact" className="text-amber hover:text-amber-dark underline">
                    contact form
                  </Link>{" "}
                  with subject line &ldquo;DMCA Takedown Request&rdquo;
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Counter-Notification</h2>
              <p>
                If you believe that your content was removed or disabled by mistake or
                misidentification, you may submit a written counter-notification containing:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Your physical or electronic signature.</li>
                <li>Identification of the material that has been removed and its prior location.</li>
                <li>
                  A statement under penalty of perjury that you have a good faith belief that the
                  material was removed as a result of mistake or misidentification.
                </li>
                <li>
                  Your name, address, and telephone number, and a statement that you consent to
                  the jurisdiction of the federal court in your district.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Repeat Infringers</h2>
              <p>
                In appropriate circumstances, SparkyPass will disable and/or terminate the
                accounts of users who are repeat infringers.
              </p>
            </section>

            <hr className="border-border dark:border-stone-700" />

            <p className="text-sm">
              This policy is part of our{" "}
              <Link href="/terms" className="text-amber hover:text-amber-dark underline">
                Terms of Service
              </Link>. For general inquiries, please visit our{" "}
              <Link href="/contact" className="text-amber hover:text-amber-dark underline">
                contact page
              </Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
