"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SparkyMessage } from "@/components/sparky";


// US States list
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

function buildDate(mm: string, dd: string, yyyy: string): Date | undefined {
  const month = Number(mm);
  const day = Number(dd);
  const year = Number(yyyy);
  if (!month || !day || yyyy.length !== 4 || !year) return undefined;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  ) {
    return date;
  }
  return undefined;
}

export default function ProfileCompletionPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [username, setUsername] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Texas");
  const [examMonth, setExamMonth] = useState("");
  const [examDay, setExamDay] = useState("");
  const [examYear, setExamYear] = useState("");
  const [newsletterOptedIn, setNewsletterOptedIn] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());

  const dobDayRef = useRef<HTMLInputElement>(null);
  const dobYearRef = useRef<HTMLInputElement>(null);
  const examDayRef = useRef<HTMLInputElement>(null);
  const examYearRef = useRef<HTMLInputElement>(null);

  const dateOfBirth = buildDate(dobMonth, dobDay, dobYear);
  const targetExamDate = buildDate(examMonth, examDay, examYear);

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.profileComplete) {
      router.push("/dashboard");
    }
  }, [status, session?.user?.profileComplete, router]);

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-cream-dark dark:from-stone-950 dark:to-stone-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </div>
    );
  }

  // Show loading while redirecting
  if (status === "unauthenticated" || session?.user?.profileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-cream-dark dark:from-stone-950 dark:to-stone-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </div>
    );
  }

  const showError = (msg: string, fields: string[] = []) => {
    setFormError(msg);
    setShakeKey((k) => k + 1);
    if (fields.length) setFieldErrors(new Set(fields));
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors(new Set());

    // Collect all missing required fields
    const trimmedUsername = username.trim();
    const errors: string[] = [];

    if (!trimmedUsername) errors.push("username");
    if (!dateOfBirth) errors.push("dob");
    if (!city.trim()) errors.push("city");
    if (!state) errors.push("state");
    if (!agreedToTerms) errors.push("terms");

    if (errors.length > 0) {
      showError("Please fill out all required fields", errors);
      return;
    }

    if (!dateOfBirth) return;

    // Format validation
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      showError("Username must be between 3 and 30 characters", ["username"]);
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      showError("Username can only contain letters, numbers, underscores, and hyphens", ["username"]);
      return;
    }

    // Validate date of birth (must be at least 18 years old)
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    if (dateOfBirth > eighteenYearsAgo) {
      showError("You must be at least 18 years old", ["dob"]);
      return;
    }

    // Validate target exam date (must be in the future, if provided)
    if (targetExamDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (targetExamDate < today) {
        showError("Target exam date must be in the future");
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          dateOfBirth: dateOfBirth.toISOString(),
          city: city.trim(),
          state,
          targetExamDate: targetExamDate?.toISOString(),
          newsletterOptedIn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Failed to save profile. Please try again.");
        return;
      }

      // Refresh the session to update profileComplete flag in JWT
      await update();

      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
            <div className="inline-flex items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-amber/15 dark:bg-stone-900 flex items-center justify-center">
                <img src="/sparkypass-icon-orange.svg" alt="SparkyPass" className="w-7 h-7" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-display">Complete Your Profile</CardTitle>
            <p className="text-muted-foreground">
              Just a few more details to personalize your experience
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sparky Welcome Message */}
            <SparkyMessage
              size="small"
              message="Welcome aboard, future Master Electrician! Let me know a bit about you so I can help you prepare for your exam."
            />

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase());
                    clearFieldError("username");
                  }}
                  disabled={isLoading}
                  autoComplete="username"
                  maxLength={30}
                  className={fieldErrors.has("username") ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  3-30 characters. Letters, numbers, underscores, and hyphens only.
                </p>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM"
                    value={dobMonth}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setDobMonth(val);
                      clearFieldError("dob");
                      if (val.length === 2) dobDayRef.current?.focus();
                    }}
                    maxLength={2}
                    disabled={isLoading}
                    autoComplete="bday-month"
                    className={`text-center ${fieldErrors.has("dob") ? "border-destructive" : ""}`}
                  />
                  <span className="flex items-center text-muted-foreground">/</span>
                  <Input
                    ref={dobDayRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="DD"
                    value={dobDay}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setDobDay(val);
                      clearFieldError("dob");
                      if (val.length === 2) dobYearRef.current?.focus();
                    }}
                    maxLength={2}
                    disabled={isLoading}
                    autoComplete="bday-day"
                    className={`text-center ${fieldErrors.has("dob") ? "border-destructive" : ""}`}
                  />
                  <span className="flex items-center text-muted-foreground">/</span>
                  <Input
                    ref={dobYearRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY"
                    value={dobYear}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setDobYear(val);
                      clearFieldError("dob");
                    }}
                    maxLength={4}
                    disabled={isLoading}
                    autoComplete="bday-year"
                    className={`text-center ${fieldErrors.has("dob") ? "border-destructive" : ""}`}
                  />
                </div>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Enter your city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    clearFieldError("city");
                  }}
                  disabled={isLoading}
                  autoComplete="address-level2"
                  className={fieldErrors.has("city") ? "border-destructive" : ""}
                />
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={state} onValueChange={(val) => { setState(val); clearFieldError("state"); }} disabled={isLoading}>
                  <SelectTrigger id="state" className={fieldErrors.has("state") ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Exam Date */}
              <div className="space-y-2">
                <Label>Target Exam Date</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM"
                    value={examMonth}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setExamMonth(val);
                      if (val.length === 2) examDayRef.current?.focus();
                    }}
                    maxLength={2}
                    disabled={isLoading}
                    className="text-center"
                  />
                  <span className="flex items-center text-muted-foreground">/</span>
                  <Input
                    ref={examDayRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="DD"
                    value={examDay}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setExamDay(val);
                      if (val.length === 2) examYearRef.current?.focus();
                    }}
                    maxLength={2}
                    disabled={isLoading}
                    className="text-center"
                  />
                  <span className="flex items-center text-muted-foreground">/</span>
                  <Input
                    ref={examYearRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY"
                    value={examYear}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setExamYear(val);
                    }}
                    maxLength={4}
                    disabled={isLoading}
                    className="text-center"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll help you create a study plan based on your target date
                </p>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => {
                    setAgreedToTerms(checked === true);
                    if (checked) {
                      setFormError("");
                      clearFieldError("terms");
                    }
                  }}
                  disabled={isLoading}
                  className={fieldErrors.has("terms") ? "border-destructive" : ""}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-amber hover:text-amber-dark underline"
                    >
                      Terms and Conditions
                    </a>
                  </Label>
                </div>
              </div>

              {/* Newsletter Opt-in */}
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="newsletter"
                  checked={newsletterOptedIn}
                  onCheckedChange={(checked) =>
                    setNewsletterOptedIn(checked === true)
                  }
                  disabled={isLoading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="newsletter"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Subscribe to our newsletter
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get study tips, NEC updates, and exam prep advice
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {formError && (
                <motion.div
                  key={shakeKey}
                  initial={{ x: 0 }}
                  animate={{ x: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className="p-3 rounded-md bg-destructive/10 text-destructive text-sm"
                >
                  {formError}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
