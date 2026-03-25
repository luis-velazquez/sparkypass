"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BetaBadge } from "@/components/ui/beta-badge";

export default function BetaAgreementPage() {
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
            <CardTitle className="text-2xl font-bold font-display flex items-center justify-center gap-2">
              Beta Participation Agreement <BetaBadge size="md" />
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: March 25, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground">
            <p>
              Welcome to the SparkyPass Beta Program! We are thrilled to have
              you on board to help us refine and perfect our exam preparation
              platform before its public release.
            </p>
            <p>
              By clicking &ldquo;I Agree&rdquo; during registration or
              otherwise accessing the SparkyPass Beta, you agree to the
              following terms:
            </p>

            <h3 className="text-lg font-semibold">
              1. Confidentiality (Non-Disclosure Agreement)
            </h3>
            <p>
              You are receiving exclusive, early access to SparkyPass. The
              features, study materials, code calculations, design, and
              functionality of this platform are strictly confidential. You
              agree not to share, screenshot, record, or discuss any unreleased
              features, questions, or interfaces with anyone outside of the
              SparkyPass Beta testing community.
            </p>

            <h3 className="text-lg font-semibold">
              2. Nature of the Beta (&ldquo;As-Is&rdquo; Service)
            </h3>
            <p>
              SparkyPass is currently in active development. The platform is
              provided strictly on an &ldquo;as-is&rdquo; basis, without any
              warranties, express or implied. Because we are actively testing
              and updating the system, there is no Service Level Agreement (SLA)
              or guaranteed uptime during the beta phase. You may experience
              bugs, disruptions, or changes in functionality.
            </p>

            <h3 className="text-lg font-semibold">
              3. Data Management and Account Access
            </h3>
            <p>
              During the beta phase, we may need to make foundational changes to
              the application. Therefore, we reserve the right to reset
              accounts, wipe user data (including saved practice exams or
              progress), or revoke access to the platform at any time without
              prior notice. We are not responsible for any lost or corrupted
              data during this testing period.
            </p>

            <h3 className="text-lg font-semibold">4. Feedback Ownership</h3>
            <p>
              Your feedback is what makes SparkyPass better for the entire
              electrical community. Any feedback, ideas, bug reports, or
              suggestions you submit regarding the platform become the exclusive
              property of SparkyPass. We may use, implement, or modify your
              suggestions without any obligation, compensation, or attribution
              to you.
            </p>

            <h3 className="text-lg font-semibold">
              5. Limitation of Liability
            </h3>
            <p>
              To the maximum extent permitted by law, SparkyPass and its
              creators shall not be liable for any damages arising out of your
              participation in the beta program. Our total liability to you is
              capped at the amount you have paid to access the beta, which is
              currently $0.00.
            </p>

            <h3 className="text-lg font-semibold">
              6. Right to Modify or Discontinue
            </h3>
            <p>
              We reserve the right to modify, suspend, or discontinue any
              aspect of the beta program, including features and pricing models,
              at our sole discretion at any time.
            </p>

            <hr className="border-border dark:border-stone-700" />

            <p className="text-sm text-muted-foreground">
              By clicking &ldquo;Create Account&rdquo; during registration, you
              acknowledge that you have read, understood, and agree to be bound
              by all terms of this agreement.
            </p>

            <div className="flex justify-center pt-2">
              <Link
                href="/register"
                className="text-amber hover:text-amber-dark font-medium"
              >
                &larr; Back to registration
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
