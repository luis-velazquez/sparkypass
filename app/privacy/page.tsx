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
              Last updated: August 7, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p>When you create an account, we collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Name and email address</li>
                <li>Password (stored securely as a hash, never in plain text)</li>
                <li>Confirmation that you are 18 or older</li>
              </ul>
              <p className="mt-2">
                Accounts created on our website may also include a username, date of birth,
                and city and state. These legacy fields are retained for existing accounts
                only and are not collected in the app.
              </p>
              <p className="mt-2">As you use the app, we also collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Quiz answers, study progress, and session history</li>
                <li>Bookmarked questions and review history</li>
                <li>Study rewards data (Watts earned, rank, streaks)</li>
                <li>Your target exam date, if you tell us when your exam is</li>
              </ul>
              <p className="mt-2">
                <strong>Subscription data</strong> &mdash; when you subscribe via Apple In-App
                Purchase we receive and store your subscription status, trial and renewal
                dates, and a purchase identifier. We never see your payment card details &mdash;
                payment is processed by Apple.
              </p>
              <p className="mt-2">
                <strong>Device and diagnostic data</strong> &mdash; a random per-install device
                identifier (used to secure your sign-in session), your device timezone (used to
                schedule study reminders at the right local time), and device model, operating
                system version, app version, and crash logs, collected automatically to diagnose
                and fix problems. If you enable reminders, we also collect a push notification
                token and platform type to deliver them.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Create and manage your account</li>
                <li>Track your study progress and personalize your experience</li>
                <li>Sync your progress across your devices</li>
                <li>Provide access to your subscription</li>
                <li>Send email verification and password reset emails</li>
                <li>Deliver study reminders and notifications you enable</li>
                <li>Diagnose crashes and improve the app and study materials</li>
              </ul>
              <p className="mt-2">
                If you join a friends leaderboard, your display name (or account name) and
                score are visible to the friends you&apos;ve added.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Third-Party Services</h2>
              <p>We use the following third-party services to operate SparkyPass:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Apple</strong> &mdash; Sign in with Apple (we receive your name and email address) and payment processing for in-app purchases</li>
                <li><strong>Google</strong> &mdash; optional sign-in (we receive your name and email address)</li>
                <li><strong>RevenueCat</strong> &mdash; processes in-app subscription purchases and entitlement status on our behalf; receives your SparkyPass account ID, purchase and subscription history, and device identifiers</li>
                <li><strong>Expo</strong> &mdash; delivers app updates and push notifications (receives your push token and device platform if you enable reminders)</li>
                <li><strong>Sentry</strong> &mdash; crash reports and app performance diagnostics (device model, OS version, app version); these reports are not linked to your account identity. While our website remains available, it also records session replays to diagnose errors</li>
                <li><strong>Stripe</strong> &mdash; payment processing for subscriptions purchased on our website (legacy accounts only; the app uses Apple In-App Purchase)</li>
                <li><strong>Resend</strong> &mdash; for sending transactional emails (verification, password reset)</li>
                <li><strong>Turso</strong> &mdash; for secure database hosting</li>
                <li><strong>Vercel</strong> &mdash; for application hosting</li>
              </ul>
              <p className="mt-2">
                We require every third-party service provider that processes your data on our
                behalf to provide the same or equal protection of your data as described in this
                policy.
              </p>
              <p className="mt-2">
                We use first-party analytics to understand how features are used and to improve the
                platform. This data is stored in our own database and is never shared with third-party
                analytics or advertising services. We do not use any third-party analytics or
                advertising SDKs, and we do not sell, rent, or share your personal information with
                third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Cookies and Authentication Tokens</h2>
              <p>
                The SparkyPass iOS app does not use cookies. It stores encrypted sign-in tokens in
                your device&apos;s secure Keychain to keep you signed in. Our website uses only
                essential cookies required to function:
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
              <h2 className="text-lg font-semibold text-foreground">5. Data Retention and Account Deletion</h2>
              <p>
                We retain your account data and study progress for as long as your account is active.
                You can delete your account at any time in the app under Settings &rarr; Delete
                account. Your account is deactivated immediately and permanently deleted after 30
                days; signing back in within 30 days restores it. You may also request deletion by
                emailing us at the address below and we will process your request within 30 days.
              </p>
              <p className="mt-2">
                Deleting your account does not cancel an Apple subscription &mdash; manage that in
                iOS Settings &rarr; your Apple Account &rarr; Subscriptions.
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
                <li>Delete your account and data (in-app or by request)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Security</h2>
              <p>
                We take reasonable measures to protect your information, including password hashing,
                encrypted connections (HTTPS), secure on-device token storage (iOS Keychain), and
                secure database access. However, no method of transmission or storage is 100% secure,
                and we cannot guarantee absolute security.
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
                SparkyPass is operated by SparkyPass LLC, the data controller for the
                information described in this policy. If you have questions about this
                Privacy Policy or wish to exercise your rights, please contact us at{" "}
                <a
                  href="mailto:support@sparkypass.com"
                  className="text-amber hover:text-amber-dark underline"
                >
                  support@sparkypass.com
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
