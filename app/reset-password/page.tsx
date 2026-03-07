"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!password) {
      setError("Please enter a new password");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setIsSuccess(true);
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // No token provided - show error
  if (!token) {
    return (
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
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-display">Invalid Link</CardTitle>
          <p className="text-muted-foreground">
            This password reset link is invalid or has been used.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <SparkyMessage
            message="No worries! Just request a new reset link and you'll be back in action."
            size="small"
          />
          <div className="text-center space-y-4">
            <Link href="/forgot-password">
              <Button className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                Request New Link
              </Button>
            </Link>
            <div>
              <Link
                href="/login"
                className="text-sm text-amber hover:text-amber-dark"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (isSuccess) {
    return (
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
            <div className="rounded-full bg-emerald/10 p-4">
              <CheckCircle className="h-12 w-12 text-emerald" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-display">Password Reset!</CardTitle>
          <p className="text-muted-foreground">
            Your password has been successfully reset.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <SparkyMessage
            message="You're all set! Now let's get back to studying for that Master Electrician exam!"
            size="small"
          />
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting to login...
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-amber mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Reset form
  return (
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
            <Lock className="h-12 w-12 text-amber" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold font-display">Reset Password</CardTitle>
        <p className="text-muted-foreground">
          Enter your new password below.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sparky encouragement */}
        <SparkyMessage
          message="Make it a strong one! Mix in some letters, numbers, and symbols if you can."
          size="small"
        />

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
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
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
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
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

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
  );
}

function ResetPasswordFallback() {
  return (
    <Card className="shadow-lg border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
      <CardHeader className="text-center space-y-4">
        <div className="inline-flex items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-amber/15 dark:bg-stone-900 flex items-center justify-center">
                <img src="/sparkypass-icon-orange.svg" alt="SparkyPass" className="w-7 h-7" />
              </div>
        </div>
        <CardTitle className="text-2xl font-bold font-display">Reset Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<ResetPasswordFallback />}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
