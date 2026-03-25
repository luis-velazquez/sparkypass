"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
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
              Privacy Policy
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: February 11, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p>When you create an account, we collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Name and email address</li>
                <li>Username</li>
                <li>Date of birth</li>
                <li>City and state</li>
                <li>Target exam date (optional)</li>
                <li>Password (stored securely as a hash, never in plain text)</li>
              </ul>
              <p className="mt-2">As you use the app, we also collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Quiz answers and progress</li>
                <li>Bookmarked questions and flashcards</li>
                <li>Study session history</li>
                <li>XP and level progression</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Create and manage your account</li>
                <li>Track your study progress and personalize your experience</li>
                <li>Send email verification and password reset emails</li>
                <li>Send newsletter communications (if you opted in)</li>
                <li>Improve the app and study materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Third-Party Services</h2>
              <p>We use the following third-party services to operate SparkyPass:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Resend</strong> &mdash; for sending transactional emails (verification, password reset, newsletter)</li>
                <li><strong>Google, Facebook, Apple</strong> &mdash; for optional OAuth sign-in (we receive your name and email from these providers)</li>
                <li><strong>Turso</strong> &mdash; for secure database hosting</li>
                <li><strong>Vercel</strong> &mdash; for application hosting</li>
                <li><strong>Sentry</strong> &mdash; for error and crash reporting to identify and fix bugs</li>
              </ul>
              <p className="mt-2">
                We use first-party analytics to understand how features are used and to improve the
                platform. This data is stored in our own database and is never shared with third-party
                analytics or advertising services. We do not sell, rent, or share your personal
                information with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Cookies</h2>
              <p>
                SparkyPass uses only essential cookies required for the app to function:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Session cookie</strong> &mdash; keeps you logged in</li>
                <li><strong>CSRF token</strong> &mdash; protects against cross-site request forgery</li>
              </ul>
              <p className="mt-2">
                We do not use any tracking cookies, advertising cookies, or third-party cookies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
              <p>
                We retain your account data and study progress for as long as your account is active.
                If you wish to delete your account and all associated data, please contact us and we
                will process your request within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Children&apos;s Privacy</h2>
              <p>
                SparkyPass is intended for users who are at least 18 years of age. We do not
                knowingly collect personal information from anyone under 18. If we become aware
                that we have collected data from a user under 18, we will delete that information
                promptly.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of newsletter communications at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Security</h2>
              <p>
                We take reasonable measures to protect your information, including password hashing,
                encrypted connections (HTTPS), and secure database access. However, no method of
                transmission or storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of
                significant changes via email or an in-app notice. Continued use of the service
                after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your rights,
                please contact us at{" "}
                <a
                  href="mailto:noreply@sparkypass.com"
                  className="text-amber hover:text-amber-dark underline"
                >
                  noreply@sparkypass.com
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
