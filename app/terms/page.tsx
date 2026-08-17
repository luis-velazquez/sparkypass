"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
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
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2"
            >
              <Zap className="h-10 w-10 text-amber" />
            </Link>
            <CardTitle className="text-2xl font-bold font-display">
              Terms and Conditions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: August 7, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By downloading or using the SparkyPass app, creating an account, or purchasing
                a subscription, you agree to be bound by these Terms and Conditions, an
                agreement between you and SparkyPass LLC (&quot;SparkyPass,&quot; &quot;we&quot;).
                If you do not agree, please do not use the service. If you downloaded the app from the
                Apple App Store, your license to use the app is additionally governed by
                Apple&apos;s standard{" "}
                <a
                  href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                  className="text-amber hover:text-amber-dark underline"
                >
                  Licensed Application End User License Agreement
                </a>{" "}
                and the App Store Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
              <p>
                SparkyPass is a study app designed to help users prepare for Texas electrician
                licensing exams (Journeyman and Master). The service includes practice quizzes,
                load calculators, study games, daily challenges, and other study tools,
                provided through the SparkyPass mobile application and related services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials.
                You agree to provide accurate information during registration and to keep your
                account information up to date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Subscriptions, Billing, and Cancellation</h2>
              <p>
                SparkyPass Pro is an auto-renewable monthly subscription purchased through Apple
                In-App Purchase:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Length and price</strong> &mdash; 1 month, $14.99 USD per month (the exact
                  price in your local currency is shown in the app before you buy)
                </li>
                <li>
                  <strong>Introductory offers</strong> &mdash; where eligible, a free trial or a
                  discounted first month may be offered; introductory offers are limited to one
                  per Apple Account
                </li>
                <li>
                  <strong>Billing</strong> &mdash; payment is charged to your Apple Account at
                  confirmation of purchase, or at the end of a free trial unless canceled before
                  the trial ends
                </li>
                <li>
                  <strong>Renewal</strong> &mdash; the subscription renews automatically unless you
                  cancel at least 24 hours before the end of the current period
                </li>
                <li>
                  <strong>Cancellation</strong> &mdash; manage or cancel anytime in iOS Settings
                  &rarr; your Apple Account &rarr; Subscriptions. Deleting the app or deleting your
                  SparkyPass account does not cancel your subscription
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Refunds</h2>
              <p>
                All purchases are processed by Apple. Refund requests are handled by Apple under
                the App Store terms &mdash; you can request one at{" "}
                <a
                  href="https://reportaproblem.apple.com"
                  className="text-amber hover:text-amber-dark underline"
                >
                  reportaproblem.apple.com
                </a>
                . SparkyPass cannot issue refunds for App Store purchases directly.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Share your account with others</li>
                <li>Reproduce or distribute the content without permission</li>
                <li>Attempt to reverse engineer or disrupt the service</li>
                <li>Use the service for any unlawful purpose</li>
              </ul>
              <p className="mt-2">
                We may suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Intellectual Property</h2>
              <p>
                All content on SparkyPass, including questions, explanations, and study materials,
                is the property of SparkyPass and is protected by copyright. NEC code references
                are used for educational purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Disclaimer</h2>
              <p>
                SparkyPass is a study aid and does not guarantee passing any licensing exam. The
                content is provided &quot;as is&quot; for educational purposes. Always refer to the
                current NEC codebook and official exam preparation materials.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Privacy</h2>
              <p>
                Our{" "}
                <Link href="/privacy" className="text-amber hover:text-amber-dark underline">
                  Privacy Policy
                </Link>{" "}
                describes what information we collect and how we use and protect it. We do not
                sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">10. Changes to Terms</h2>
              <p>
                We reserve the right to update these terms at any time. Continued use of the
                service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
              <p>
                SparkyPass is operated by SparkyPass LLC. If you have questions about these
                terms, please contact us at{" "}
                <a
                  href="mailto:support@sparkypass.com"
                  className="text-amber hover:text-amber-dark underline"
                >
                  support@sparkypass.com
                </a>
                .
              </p>
            </section>

            <section className="mt-8 pt-6 border-t border-border">
              <h2 className="text-lg font-semibold text-foreground">Official NEC&reg; Disclaimer</h2>
              <p>
                This app is an independent educational tool and is not affiliated with, endorsed by,
                or sponsored by the National Fire Protection Association (NFPA). While we strive to
                provide the most accurate information based on the 2023 and 2026 editions of the
                National Electrical Code&reg;, electrical codes vary by jurisdiction and are subject
                to change. This content is for educational purposes only and does not constitute
                professional engineering or installation advice. Always consult your local Authority
                Having Jurisdiction (AHJ) and the official NFPA 70&reg; text before performing
                electrical work.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
