"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BetaBadge } from "@/components/ui/beta-badge";

export default function AcceptableUsePage() {
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
            <CardTitle className="text-2xl font-bold font-display flex items-center justify-center gap-2">
              Acceptable Use Policy <BetaBadge size="md" />
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: March 25, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Purpose</h2>
              <p>
                This Acceptable Use Policy (&ldquo;AUP&rdquo;) outlines the rules and guidelines
                for using SparkyPass. By accessing or using the platform, you agree to comply with
                this policy. Violations may result in account suspension or termination.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Permitted Use</h2>
              <p>SparkyPass is designed for:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Studying for electrical licensing exams (Journeyman, Master, etc.)</li>
                <li>Practicing NEC code questions and calculations</li>
                <li>Using study tools, flashcards, and mock exams for personal exam preparation</li>
                <li>Providing feedback to help improve the platform during the beta period</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Prohibited Activities</h2>
              <p>You may <strong className="text-foreground">not</strong> use SparkyPass to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Copy, reproduce, or redistribute questions, answers, explanations, or any study content</li>
                <li>Share your account credentials with others or allow unauthorized access</li>
                <li>Use automated tools, bots, or scrapers to extract content from the platform</li>
                <li>Attempt to reverse-engineer, decompile, or access the source code of the application</li>
                <li>Exploit bugs, vulnerabilities, or errors instead of reporting them</li>
                <li>Harass, abuse, or send unsolicited messages to other users</li>
                <li>Impersonate another person or misrepresent your identity</li>
                <li>Use the platform for any illegal purpose or in violation of any applicable laws</li>
                <li>Circumvent or attempt to circumvent subscription or access restrictions</li>
                <li>Upload malicious code, viruses, or any content designed to harm the platform or its users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Content Ownership</h2>
              <p>
                All questions, explanations, code references, study materials, and interactive content
                on SparkyPass are proprietary. You are granted a limited, personal, non-transferable
                license to use this content solely for your own exam preparation. Commercial use,
                redistribution, or creating derivative works is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Beta-Specific Rules</h2>
              <p>During the beta period, the following additional rules apply:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Do not share screenshots, recordings, or descriptions of unreleased features outside the beta community</li>
                <li>Report bugs and issues through the in-app feedback widget or contact page rather than public forums</li>
                <li>Understand that features, content, and your data may change or be reset during the beta</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Reporting Violations</h2>
              <p>
                If you become aware of any violations of this policy, please report them through our{" "}
                <Link href="/contact" className="text-amber hover:text-amber-dark underline">
                  contact page
                </Link>{" "}
                or the in-app feedback widget. We take all reports seriously and will investigate promptly.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Enforcement</h2>
              <p>
                SparkyPass reserves the right to suspend or terminate any account that violates
                this Acceptable Use Policy, with or without notice. In cases of severe or repeated
                violations, we may pursue legal remedies as appropriate.
              </p>
            </section>

            <hr className="border-border dark:border-stone-700" />

            <p className="text-sm">
              This policy is part of our{" "}
              <Link href="/terms" className="text-amber hover:text-amber-dark underline">
                Terms of Service
              </Link>. If you have questions about what is or isn&apos;t acceptable, please{" "}
              <Link href="/contact" className="text-amber hover:text-amber-dark underline">
                contact us
              </Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
