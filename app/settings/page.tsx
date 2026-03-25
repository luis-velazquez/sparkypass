"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ACTIONS, EVENTS, STATUS, type CallBackProps } from "react-joyride";
import { SETTINGS_TOUR_STEP } from "@/components/tour";
import { SparkyTooltip } from "@/components/tour";

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  Loader2,
  Save,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Lightbulb,
  CreditCard,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SparkyMessage } from "@/components/sparky";
import { TIP_ENABLED_KEY } from "@/lib/tips";
import { validateUsername, sanitizeUsernameInput, USERNAME_MAX } from "@/lib/username";

interface ProfileData {
  name: string;
  email: string;
  username: string | null;
  authProvider: string;
  city: string | null;
  state: string | null;
  showHintsOnMaster: boolean;
  necYear: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  subscriptionPeriodEnd: string | null;
  isBetaTester: boolean;
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettingsTour, setShowSettingsTour] = useState(false);

  // Name state
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");

  // Username state
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");

  // Location state
  const [city, setCity] = useState("");
  const [originalCity, setOriginalCity] = useState("");
  const [state, setState] = useState("");
  const [originalState, setOriginalState] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Quiz preferences state
  const [showHintsOnMaster, setShowHintsOnHard] = useState(false);
  const [necYear, setNecYear] = useState("2023");
  const [quizPrefSaving, setQuizPrefSaving] = useState(false);
  const [quizPrefSuccess, setQuizPrefSuccess] = useState("");
  const [quizPrefError, setQuizPrefError] = useState("");

  // Sparky Tips state
  const [tipEnabled, setTipEnabled] = useState(true);

  // Billing state
  const [billingLoading, setBillingLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || "");
        setOriginalName(data.name || "");
        setUsername(data.username || "");
        setOriginalUsername(data.username || "");
        setCity(data.city || "");
        setOriginalCity(data.city || "");
        setState(data.state || "");
        setOriginalState(data.state || "");
        setShowHintsOnHard(data.showHintsOnMaster ?? false);
        setNecYear(data.necYear || "2023");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchProfile();
      const stored = localStorage.getItem(TIP_ENABLED_KEY);
      if (stored === "false") setTipEnabled(false);
    }
  }, [status, router, fetchProfile]);

  // Start settings tour step if arriving from dashboard tour
  useEffect(() => {
    if (!loading && profile && searchParams.get("tour") === "1") {
      const timer = setTimeout(() => setShowSettingsTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, profile, searchParams]);

  const handleSettingsTourCallback = useCallback(
    (data: CallBackProps) => {
      const { status: tourStatus, action, type } = data;
      const done =
        tourStatus === STATUS.FINISHED ||
        tourStatus === STATUS.SKIPPED ||
        (type === EVENTS.STEP_AFTER && action === ACTIONS.CLOSE) ||
        (action === ACTIONS.CLOSE && type === EVENTS.TARGET_NOT_FOUND);

      if (done) {
        setShowSettingsTour(false);
        router.push("/dashboard");
      }
    },
    [router]
  );

  const handleNameChange = (value: string) => {
    setName(value);
    setUsernameError("");
    setUsernameSuccess("");
  };

  const handleUsernameChange = (value: string) => {
    setUsername(sanitizeUsernameInput(value));
    setUsernameError("");
    setUsernameSuccess("");
  };

  const handleProfileSave = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      setUsernameError("Name is required");
      return;
    }

    const trimmedUsername = username.trim();
    const usernameCheck = validateUsername(trimmedUsername);
    if (!usernameCheck.valid) {
      setUsernameError(usernameCheck.error!);
      return;
    }

    setUsernameSaving(true);
    setUsernameError("");
    setUsernameSuccess("");

    try {
      const res = await fetch("/api/settings/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, username: trimmedUsername, city: city.trim(), state: state.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUsernameError(data.error || "Failed to save changes");
        return;
      }

      setOriginalName(data.name);
      setName(data.name);
      setOriginalUsername(data.username);
      setUsername(data.username);
      setCity(data.city || "");
      setOriginalCity(data.city || "");
      setState(data.state || "");
      setOriginalState(data.state || "");
      setUsernameSuccess("Profile updated successfully!");
      setTimeout(() => setUsernameSuccess(""), 3000);
    } catch {
      setUsernameError("Something went wrong. Please try again.");
    } finally {
      setUsernameSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed to change password");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password changed successfully!");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const saveQuizPreference = async (data: { showHintsOnMaster?: boolean; necYear?: string }) => {
    setQuizPrefSaving(true);
    setQuizPrefError("");
    setQuizPrefSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        setQuizPrefError("Failed to update preference");
        return;
      }

      if (data.showHintsOnMaster !== undefined) setShowHintsOnHard(data.showHintsOnMaster);
      if (data.necYear !== undefined) {
        setNecYear(data.necYear);
        window.dispatchEvent(new CustomEvent("nec-year-updated", { detail: data.necYear }));
      }
      setQuizPrefSuccess("Preference saved!");
      setTimeout(() => setQuizPrefSuccess(""), 3000);
    } catch {
      setQuizPrefError("Something went wrong. Please try again.");
    } finally {
      setQuizPrefSaving(false);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setBillingLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-muted dark:bg-stone-800 rounded w-48 mb-8" />
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="h-64 bg-muted dark:bg-stone-800 rounded" />
              <div className="h-64 bg-muted dark:bg-stone-800 rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load settings.</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const isOAuth = profile.authProvider !== "email";
  const nameChanged = name !== originalName;
  const usernameChanged = username !== originalUsername;
  const cityChanged = city !== originalCity;
  const stateChanged = state !== originalState;
  const profileChanged = nameChanged || usernameChanged || cityChanged || stateChanged;

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Account Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your username and security preferences
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/30 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.08)]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-purple" />
                Profile
                {profile.isBetaTester && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber/10 text-amber border border-amber/30 dark:bg-sparky-green/10 dark:text-sparky-green dark:border-sparky-green/30">
                    <Zap className="h-3 w-3" />
                    Beta Tester
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  value={profile.email}
                  disabled
                  className="bg-muted/50 dark:bg-stone-800/50"
                />
              </div>

              {/* Name (editable) */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              {/* Username (editable) */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="e.g. VoltageVince"
                  maxLength={USERNAME_MAX}
                />
                <p className="text-xs text-muted-foreground">
                  3-20 characters. Must start with a letter. Letters, numbers, underscores, and hyphens.
                </p>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    City
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setUsernameError("");
                      setUsernameSuccess("");
                    }}
                    placeholder="Your city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setUsernameError("");
                      setUsernameSuccess("");
                    }}
                    placeholder="TX"
                    maxLength={2}
                  />
                </div>
              </div>

              {usernameError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {usernameError}
                </div>
              )}

              {usernameSuccess && (
                <div className="p-3 rounded-md bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {usernameSuccess}
                </div>
              )}

              <Button
                onClick={handleProfileSave}
                disabled={!profileChanged || usernameSaving || username.trim().length < 3 || name.trim().length < 1}
                className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
              >
                {usernameSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quiz Preferences Card */}
        <motion.div
          data-tour="quiz-preferences"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/30 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.08)]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber" />
                Quiz Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* NEC Year */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    NEC Edition
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Select which NEC code year you&apos;re studying for.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["2023", "2026"] as const).map((year) => (
                    <button
                      key={year}
                      onClick={() => saveQuizPreference({ necYear: year })}
                      disabled={quizPrefSaving}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all disabled:opacity-50 ${
                        necYear === year
                          ? "bg-amber text-white border-amber dark:bg-sparky-green dark:text-stone-950 dark:border-sparky-green"
                          : "bg-muted/50 dark:bg-stone-800/50 text-muted-foreground border-border dark:border-stone-700 hover:border-amber/50 dark:hover:border-sparky-green/50 hover:text-foreground"
                      }`}
                    >
                      {year} NEC
                    </button>
                  ))}
                </div>
              </div>


              {/* Hints toggle */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Show hints on Master difficulty
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hints are hidden by default on Master difficulty for extra challenge. Enable this to show them.
                  </p>
                </div>
                <button
                  onClick={() => saveQuizPreference({ showHintsOnMaster: !showHintsOnMaster })}
                  disabled={quizPrefSaving}
                  className={`relative inline-flex items-center !h-[18px] !min-h-0 w-[48px] md:!h-6 md:!min-h-0 md:w-11 flex-shrink-0 cursor-pointer rounded-full p-[3px] md:p-0 md:border-2 md:border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber/50 dark:focus:ring-sparky-green/50 focus:ring-offset-2 disabled:opacity-50 ${
                    showHintsOnMaster ? "bg-amber dark:bg-sparky-green" : "bg-muted dark:bg-stone-800"
                  }`}
                  role="switch"
                  aria-checked={showHintsOnMaster}
                >
                  <span
                    className={`pointer-events-none block h-[16px] w-[16px] md:h-5 md:w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showHintsOnMaster ? "translate-x-[26px] md:translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>


              {/* Sparky Tips toggle */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Sparky Tips
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Show the Sparky Tip button in the navigation to replay previously unlocked tips.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !tipEnabled;
                    setTipEnabled(next);
                    localStorage.setItem(TIP_ENABLED_KEY, String(next));
                  }}
                  className={`relative inline-flex items-center !h-[18px] !min-h-0 w-[48px] md:!h-6 md:!min-h-0 md:w-11 flex-shrink-0 cursor-pointer rounded-full p-[3px] md:p-0 md:border-2 md:border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber/50 dark:focus:ring-sparky-green/50 focus:ring-offset-2 ${
                    tipEnabled ? "bg-amber dark:bg-sparky-green" : "bg-muted dark:bg-stone-800"
                  }`}
                  role="switch"
                  aria-checked={tipEnabled}
                >
                  <span
                    className={`pointer-events-none block h-[16px] w-[16px] md:h-5 md:w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      tipEnabled ? "translate-x-[26px] md:translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Replay onboarding */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-border dark:border-stone-800">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Replay Onboarding
                  </p>
                  <p className="text-xs text-muted-foreground">
                    See the welcome tour and dashboard highlights again.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border dark:border-stone-700 flex-shrink-0"
                  onClick={async () => {
                    try {
                      await fetch("/api/profile", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ hasSeenOnboarding: false, hasSeenTour: false }),
                      });
                      router.push("/dashboard");
                    } catch {
                      // ignore
                    }
                  }}
                >
                  Replay
                </Button>
              </div>

              {quizPrefError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {quizPrefError}
                </div>
              )}

              {quizPrefSuccess && (
                <div className="p-3 rounded-md bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {quizPrefSuccess}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Billing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/30 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.08)]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile.subscriptionStatus === "active"
                      ? "bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green"
                      : profile.subscriptionStatus === "trialing"
                        ? "bg-amber/10 text-amber"
                        : profile.subscriptionStatus === "canceled"
                          ? "bg-amber/10 text-amber"
                          : profile.subscriptionStatus === "past_due"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted dark:bg-stone-800 text-muted-foreground"
                  }`}
                >
                  {profile.subscriptionStatus === "active"
                    ? "Active"
                    : profile.subscriptionStatus === "trialing"
                      ? "Free Trial"
                      : profile.subscriptionStatus === "canceled"
                        ? "Canceled"
                        : profile.subscriptionStatus === "past_due"
                          ? "Payment Failed"
                          : profile.subscriptionStatus === "expired"
                            ? "Expired"
                            : "No Subscription"}
                </span>
              </div>

              {profile.subscriptionStatus === "trialing" && profile.trialEndsAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trial ends</span>
                  <span className="text-sm">
                    {new Date(profile.trialEndsAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}

              {profile.subscriptionPeriodEnd && (profile.subscriptionStatus === "active" || profile.subscriptionStatus === "canceled") && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {profile.subscriptionStatus === "canceled" ? "Access until" : "Next billing date"}
                  </span>
                  <span className="text-sm">
                    {new Date(profile.subscriptionPeriodEnd).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}

              {(profile.subscriptionStatus === "active" || profile.subscriptionStatus === "past_due" || profile.subscriptionStatus === "canceled") && (
                <Button
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  variant="outline"
                  className="w-full border-border dark:border-stone-700"
                >
                  {billingLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Manage Billing
                    </>
                  )}
                </Button>
              )}

              {(!profile.subscriptionStatus || profile.subscriptionStatus === "expired" || (profile.subscriptionStatus === "trialing")) && (
                <Button
                  onClick={() => router.push("/pricing")}
                  className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                >
                  View Plans
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/30 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.08)]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald dark:text-sparky-green" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isOAuth ? (
                <div className="p-4 rounded-md bg-muted/50 dark:bg-stone-800/50 text-sm text-muted-foreground flex items-start gap-3">
                  <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>
                    You signed in with{" "}
                    <span className="font-medium text-foreground capitalize">
                      {profile.authProvider}
                    </span>
                    . Your password is managed by your provider.
                  </p>
                </div>
              ) : (
                <>
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setPasswordError("");
                          setPasswordSuccess("");
                        }}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPasswordError("");
                          setPasswordSuccess("");
                        }}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 characters
                    </p>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                        setPasswordSuccess("");
                      }}
                      placeholder="Confirm new password"
                    />
                  </div>

                  {passwordError && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 rounded-md bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {passwordSuccess}
                    </div>
                  )}

                  <Button
                    onClick={handlePasswordChange}
                    disabled={
                      passwordSaving ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                  >
                    {passwordSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sparky Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <SparkyMessage
            size="medium"
            message="Keeping your account secure is important! A strong password is like good insulation — it protects what matters."
          />
        </motion.div>
      </div>
      </div>

      {/* Settings tour step (during dashboard tour) */}
      {showSettingsTour && (
        <Joyride
          run={showSettingsTour}
          steps={[SETTINGS_TOUR_STEP]}
          continuous
          scrollToFirstStep
          scrollOffset={120}
          tooltipComponent={SparkyTooltip}
          callback={handleSettingsTourCallback}
          styles={{
            options: {
              overlayColor: "rgba(0, 0, 0, 0.6)",
              zIndex: 60,
            },
            overlay: {
              zIndex: 60,
            },
            spotlight: {
              borderRadius: 12,
            },
          }}
          floaterProps={{
            styles: {
              floater: {
                zIndex: 70,
              },
            },
          }}
        />
      )}
    </main>
  );
}
