"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";

const sparkyTips = [
  "While you wait, here's a tip: The NEC is updated every 3 years - 2023 is the current edition!",
  "Fun fact: A Master Electrician must have at least 12,000 hours of practical experience in Texas!",
  "Did you know? Article 250 on Grounding & Bonding is one of the most tested areas on the exam.",
  "Pro tip: Load calculations in Article 220 appear frequently on the Master exam.",
  "Remember: The Texas Master Electrician exam has a 26% pass rate - but with SparkyPass, you'll beat those odds!",
];

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");
  const [sparkyTip] = useState(
    () => sparkyTips[Math.floor(Math.random() * sparkyTips.length)]
  );

  // Token verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  // Password creation state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);

  // Step 1: Validate the token exists (lightweight check)
  useEffect(() => {
    if (!token) return;

    const checkToken = async () => {
      setIsVerifying(true);
      setVerificationError("");

      try {
        // Verify the token and email — but don't set password yet
        const response = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setVerificationError(data.error || "Verification failed");
          return;
        }

        setTokenValid(true);
        setVerifiedEmail(data.email || "");
      } catch {
        setVerificationError("Something went wrong. Please try again.");
      } finally {
        setIsVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  // Step 2: Submit password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!password) {
      setPasswordError("Please enter a password");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      // Set password via API (token already verified email, now we just save the password)
      const response = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifiedEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Failed to set password");
        return;
      }

      setSetupComplete(true);

      // Auto-login with the new credentials
      const signInResult = await signIn("credentials", {
        email: verifiedEmail,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Login failed but password was set — send to login page
        setTimeout(() => (window.location.href = "/login"), 1500);
      } else {
        // Success — go to profile completion
        setTimeout(() => (window.location.href = "/register/profile"), 1500);
      }
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendError("");
    setResendSuccess(false);

    try {
      const response = await fetch("/api/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResendError(data.error || "Failed to resend email");
        return;
      }

      setResendSuccess(true);
    } catch {
      setResendError("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // --- Token present: verification + password creation flow ---
  if (token) {
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
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-xl bg-amber/15 dark:bg-stone-900 flex items-center justify-center">
                  <img src="/sparkypass-icon-orange.svg" alt="SparkyPass" className="w-7 h-7" />
                </div>
              </Link>
              <CardTitle className="text-2xl font-bold font-display">
                {isVerifying
                  ? "Verifying Email..."
                  : setupComplete
                  ? "You're All Set!"
                  : tokenValid
                  ? "Create Your Password"
                  : "Verification Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Verifying spinner */}
              {isVerifying && (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-amber" />
                  <p className="text-muted-foreground text-center">
                    Please wait while we verify your email...
                  </p>
                </div>
              )}

              {/* Setup complete */}
              {setupComplete && (
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle className="h-16 w-16 text-emerald" />
                  <p className="text-muted-foreground text-center">
                    Your account is ready! Signing you in...
                  </p>
                </div>
              )}

              {/* Password creation form */}
              {tokenValid && !setupComplete && (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-10 w-10 text-emerald" />
                    <p className="text-sm text-muted-foreground text-center">
                      Email verified! Now create a password for your account.
                    </p>
                  </div>

                  {passwordError && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {passwordError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isSubmitting}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isSubmitting}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        "Set Password & Continue"
                      )}
                    </Button>
                  </form>
                </>
              )}

              {/* Verification error */}
              {verificationError && (
                <div className="flex flex-col items-center gap-4">
                  <AlertCircle className="h-16 w-16 text-destructive" />
                  <p className="text-destructive">{verificationError}</p>
                  <p className="text-sm text-muted-foreground text-center">
                    The verification link may have expired or already been
                    used.
                  </p>
                  <Link href="/login">
                    <Button className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                      Go to Login
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // --- No token: "check your email" message ---
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
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-xl bg-amber/15 dark:bg-stone-900 flex items-center justify-center">
                <img src="/sparkypass-icon-orange.svg" alt="SparkyPass" className="w-7 h-7" />
              </div>
            </Link>
            <div className="flex justify-center">
              <div className="rounded-full bg-amber/10 p-4">
                <Mail className="h-12 w-12 text-amber" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-display">
              Check Your Email
            </CardTitle>
            <p className="text-muted-foreground">
              We&apos;ve sent a verification link to
              {email && (
                <span className="block font-medium text-foreground mt-1">
                  {email}
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sparky Tip */}
            <SparkyMessage message={sparkyTip} size="small" />

            {/* Resend Email Button */}
            <div className="text-center space-y-2">
              {resendSuccess ? (
                <div className="flex items-center justify-center gap-2 text-emerald">
                  <CheckCircle className="h-5 w-5" />
                  <span>Email sent! Check your inbox.</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive the email?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={isResending || !email}
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend Email"
                    )}
                  </Button>
                </>
              )}

              {resendError && (
                <p className="text-sm text-destructive">{resendError}</p>
              )}
            </div>

            {/* Instructions */}
            <div className="rounded-lg bg-muted dark:bg-stone-800 p-4 text-sm space-y-2">
              <p className="font-medium">What to do:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email</li>
                <li>Wait a few minutes for the email to arrive</li>
              </ul>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-amber hover:text-amber-dark"
              >
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-cream-dark dark:from-stone-950 dark:to-stone-950">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
