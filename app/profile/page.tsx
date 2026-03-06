"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  CalendarIcon,
  Star,
  TrendingUp,
  Award,
  LogOut,
  Loader2,
  Save,
  CheckCircle2,
  Brain,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SparkyMessage } from "@/components/sparky";
import { getClassificationTitle, getClassificationProgress } from "@/lib/levels";
import { cn } from "@/lib/utils";

interface UserProfile {
  name: string;
  email: string;
  city: string | null;
  state: string | null;
  dateOfBirth: string | null;
  targetExamDate: string | null;
  newsletterOptedIn: boolean;
  wattsBalance: number;
  wattsLifetime: number;
  createdAt: string;
}

interface ProgressStats {
  totalAnswered: number;
  correctCount: number;
  accuracy: number;
  quizzesCompleted: number;
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Editable fields
  const [targetExamDate, setTargetExamDate] = useState<Date | undefined>(undefined);
  const [newsletterOptedIn, setNewsletterOptedIn] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/progress/stats"),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setTargetExamDate(
          profileData.targetExamDate
            ? new Date(profileData.targetExamDate)
            : undefined
        );
        setNewsletterOptedIn(profileData.newsletterOptedIn);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setProgressStats({
          totalAnswered: statsData.totalAnswered || 0,
          correctCount: statsData.correctCount || 0,
          accuracy: statsData.accuracy || 0,
          quizzesCompleted: statsData.recentSessions?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
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
      fetchData();
    }
  }, [status, router, fetchData]);

  // Track changes
  useEffect(() => {
    if (!profile) return;

    const originalTargetDate = profile.targetExamDate
      ? new Date(profile.targetExamDate).toDateString()
      : null;
    const currentTargetDate = targetExamDate?.toDateString() || null;

    const hasExamDateChanged = originalTargetDate !== currentTargetDate;
    const hasNewsletterChanged = profile.newsletterOptedIn !== newsletterOptedIn;

    setHasChanges(hasExamDateChanged || hasNewsletterChanged);
  }, [profile, targetExamDate, newsletterOptedIn]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetExamDate: targetExamDate?.toISOString() || null,
          newsletterOptedIn,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSaveError(data.error || "Failed to save changes");
        return;
      }

      // Refresh profile data
      await fetchData();
      setSaveSuccess(true);
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || loading) {
    return (
      <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-muted dark:bg-stone-800 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-muted dark:bg-stone-800 rounded" />
              <div className="h-48 bg-muted dark:bg-stone-800 rounded" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-muted dark:bg-stone-800 rounded" />
              <div className="h-48 bg-muted dark:bg-stone-800 rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load profile data.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </main>
    );
  }

  const classificationTitle = getClassificationTitle(profile.wattsBalance);
  const classificationProgress = getClassificationProgress(profile.wattsBalance);
  const memberSince = profile.createdAt
    ? format(new Date(profile.createdAt), "MMMM d, yyyy")
    : "Unknown";

  return (
    <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-8">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Your Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and view your progress
        </p>
      </motion.div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info and Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-purple" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-soft dark:bg-purple/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="text-foreground font-medium">{profile.name}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-amber" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="text-foreground font-medium">{profile.email}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-emerald" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-foreground font-medium">
                      {profile.city && profile.state
                        ? `${profile.city}, ${profile.state}`
                        : "Not set"}
                    </p>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-soft dark:bg-purple/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="text-foreground font-medium">
                      {profile.dateOfBirth
                        ? format(new Date(profile.dateOfBirth), "MMMM d, yyyy")
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Exam Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-amber" />
                  Exam Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Target Exam Date */}
                <div className="space-y-2">
                  <Label htmlFor="targetExamDate">Target Exam Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="targetExamDate"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !targetExamDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetExamDate
                          ? format(targetExamDate, "MMMM d, yyyy")
                          : "Select your target exam date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={targetExamDate}
                        onSelect={setTargetExamDate}
                        disabled={(date) => date < new Date()}
                        defaultMonth={targetExamDate || new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    This helps us personalize your study recommendations
                  </p>
                </div>

                {/* Newsletter Opt-in */}
                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="newsletter"
                    checked={newsletterOptedIn}
                    onCheckedChange={(checked) =>
                      setNewsletterOptedIn(checked === true)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="newsletter"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Subscribe to newsletter
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get study tips, NEC updates, and exam prep advice
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                {saveError && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-3 rounded-md bg-emerald/10 text-emerald text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Changes saved successfully!
                  </div>
                )}

                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                >
                  {saving ? (
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

          {/* Sparky Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <SparkyMessage
              size="medium"
              message="Looking good! Keep working hard and you'll be a Master Electrician before you know it. I believe in you!"
            />
          </motion.div>
        </div>

        {/* Right Column - Stats and Account */}
        <div className="space-y-6">
          {/* Account Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber" />
                  Account Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Member Since */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member since</span>
                  <span className="text-sm font-medium text-foreground">{memberSince}</span>
                </div>

                {/* Watts Balance */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Watts Balance</span>
                  <span className="text-sm font-medium text-amber">
                    {profile.wattsBalance.toLocaleString()}W
                  </span>
                </div>

                {/* Classification */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Classification</span>
                  <span className="text-sm font-medium text-purple dark:text-purple-light">
                    {classificationTitle}
                  </span>
                </div>

                {/* Classification Progress */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress to next classification</span>
                    <span>{classificationProgress.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${classificationProgress.percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber to-amber-light rounded-full"
                    />
                  </div>
                  {classificationProgress.next ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Next: {classificationProgress.next.title} at {classificationProgress.next.minWatts.toLocaleString()}W
                    </p>
                  ) : (
                    <p className="text-xs text-amber dark:text-sparky-green mt-1 font-medium">
                      Max Classification!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lifetime Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald" />
                  Lifetime Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Questions Answered */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {progressStats?.totalAnswered || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Questions answered</p>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-soft dark:bg-purple/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {progressStats?.totalAnswered
                        ? `${progressStats.accuracy}%`
                        : "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">Overall accuracy</p>
                  </div>
                </div>

                {/* Quizzes Completed */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-amber" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {progressStats?.quizzesCompleted || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Quizzes completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sign Out Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-border dark:border-stone-700 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
