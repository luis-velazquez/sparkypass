"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, Shield, Clock, BookOpen, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BetaBadge } from "@/components/ui/beta-badge";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Basic validation
    if (!name.trim()) {
      setFormError("Please enter your full name");
      return;
    }

    if (!email) {
      setFormError("Please enter your email address");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    if (!ageConfirmed) {
      setFormError("You must be at least 18 years old to use SparkyPass");
      return;
    }

    setIsLoading(true);
    try {
      // Register the user via API
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase(),
          ageConfirmed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Registration failed. Please try again.");
        return;
      }

      // Redeem referral code if provided (non-blocking)
      if (referralCode.trim() && data.userId) {
        fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: referralCode.trim(), referredUserId: data.userId }),
        }).catch(() => {});
      }

      // Redirect to verify-email page
      const userEmail = data.email || email.toLowerCase();
      router.push(`/verify-email?email=${encodeURIComponent(userEmail)}`);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = (provider: string) => {
    signIn(provider, { callbackUrl: "/register/profile" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-b from-cream to-cream-dark dark:from-stone-950 dark:to-stone-950 relative">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-lg border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-amber/15 dark:bg-stone-900 flex items-center justify-center">
                <img src="/sparkypass-icon-orange.svg" alt="SparkyPass" className="w-7 h-7" />
              </div>
            </Link>
            <CardTitle className="text-2xl font-bold font-display flex items-center justify-center gap-2">Start Your Free Trial <BetaBadge /></CardTitle>
            <p className="text-muted-foreground">
              7 days of full access — no credit card required
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {formError}
              </div>
            )}

            {/* Social Sign-up Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-11 relative"
                onClick={() => handleSocialSignUp("google")}
                disabled={isLoading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Registration Form — name + email only */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()))}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral" className="text-muted-foreground">Referral Code <span className="text-xs">(optional)</span></Label>
                <Input
                  id="referral"
                  type="text"
                  placeholder="e.g. A1B2C3"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase().slice(0, 6))}
                  disabled={isLoading}
                  maxLength={6}
                  className="uppercase tracking-widest"
                />
              </div>

              <div className="flex items-start gap-2.5">
                <input
                  id="age-confirm"
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  disabled={isLoading}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-amber dark:accent-sparky-green cursor-pointer"
                />
                <label htmlFor="age-confirm" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  I confirm that I am at least 18 years old and agree to the{" "}
                  <Link href="/terms" className="text-amber hover:text-amber-dark underline" target="_blank">
                    Terms of Service
                  </Link>,{" "}
                  <Link href="/privacy" className="text-amber hover:text-amber-dark underline" target="_blank">
                    Privacy Policy
                  </Link>, and{" "}
                  <Link href="/beta-agreement" className="text-amber hover:text-amber-dark underline" target="_blank">
                    Beta Participation Agreement
                  </Link>.
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-amber hover:text-amber-dark"
              >
                Sign in
              </Link>
            </p>

            {/* Trial Transparency */}
            <div className="rounded-lg bg-muted/50 dark:bg-stone-800/50 border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trial Transparency</p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <CreditCard className="h-4 w-4 text-emerald flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">No credit card is collected today.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-emerald flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">Trial expires automatically after 7 days — no surprise charges.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <BookOpen className="h-4 w-4 text-emerald flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">Your study progress is saved even if the trial expires.</p>
                </div>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Secured by Stripe</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <svg className="h-5 w-8" viewBox="0 0 32 20" fill="none"><rect width="32" height="20" rx="3" fill="#1A1F71"/><text x="16" y="13" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">VISA</text></svg>
                <svg className="h-5 w-8" viewBox="0 0 32 20" fill="none"><rect width="32" height="20" rx="3" fill="#252525"/><circle cx="12" cy="10" r="6" fill="#EB001B"/><circle cx="20" cy="10" r="6" fill="#F79E1B"/><path d="M16 5.6a6 6 0 0 1 0 8.8 6 6 0 0 1 0-8.8z" fill="#FF5F00"/></svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
