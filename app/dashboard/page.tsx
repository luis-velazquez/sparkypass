"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  BookOpen,
  ClipboardCheck,
  Calendar,
  Flame,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calculator,
  Bookmark,
  X,
  ChevronDown,
  ChevronRight,
  Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { ExamCountdown } from "@/components/exam";
import { getLevelTitle, getXPProgress } from "@/lib/levels";
import { CATEGORIES } from "@/types/question";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { TrialStatusHeader } from "@/components/subscription/TrialStatusHeader";
import { DailyChallengeBanner } from "@/components/daily";

interface SavedFlashcard {
  id: string;
  flashcardId: string;
  front: string;
  back: string;
  necReference: string;
  setName: string;
  createdAt: string;
}

interface SavedQuestion {
  id: string;
  questionId: string;
  question: string;
  category: string;
  savedAt: string;
}

interface UserData {
  name: string;
  username: string | null;
  xp: number;
  level: number;
  studyStreak: number;
  targetExamDate: string | null;
}

interface CategoryStat {
  slug: string;
  answered: number;
  correct: number;
  accuracy: number;
}

interface RecentSession {
  id: string;
  sessionType: string;
  categorySlug: string | null;
  questionsAnswered: number | null;
  questionsCorrect: number | null;
  startedAt: string | null;
  endedAt: string | null;
  xpEarned: number;
}

interface SavedQuizProgress {
  categorySlug: string;
  difficulty?: string;
  questionIds: string[];
  currentQuestionIndex: number;
  answers: Record<string, number>;
  timestamp: number;
}

interface ProgressStats {
  totalAnswered: number;
  uniqueQuestionsAnswered: number;
  totalQuestionsInBank: number;
  correctCount: number;
  accuracy: number;
  answeredToday: number;
  categoryStats: CategoryStat[];
  recentSessions: RecentSession[];
  xp: number;
  level: number;
  studyStreak: number;
  bestStudyStreak: number;
  dailyChallengeCompleted: boolean;
  dailyChallengeXpEarned: number;
  dailyChallengeXpReward: number;
}

const features = [
  {
    title: "Quiz",
    description: "Practice with NEC-based questions and get instant feedback.",
    icon: Brain,
    href: "/quiz",
    color: "text-purple dark:text-purple-light",
    bg: "bg-purple/10 group-hover:bg-purple/20 dark:bg-purple/15 dark:group-hover:bg-purple/25",
  },
  {
    title: "Flashcards",
    description: "Memorize key formulas and code references.",
    icon: BookOpen,
    href: "/flashcards",
    color: "text-emerald dark:text-emerald-light",
    bg: "bg-emerald/10 group-hover:bg-emerald/20 dark:bg-emerald/15 dark:group-hover:bg-emerald/25",
  },
  {
    title: "Load Calculator",
    description: "Learn residential load calculations step by step with Sparky.",
    icon: Calculator,
    href: "/load-calculator",
    color: "text-amber dark:text-amber-light",
    bg: "bg-amber/10 group-hover:bg-amber/20 dark:bg-amber/15 dark:group-hover:bg-amber/25",
  },
  {
    title: "Mock Exam",
    description: "Simulate the real exam with timed practice tests.",
    icon: ClipboardCheck,
    href: "/mock-exam",
    color: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-500/10 group-hover:bg-sky-500/20 dark:bg-sky-500/15 dark:group-hover:bg-sky-500/25",
  },
  {
    title: "Daily Challenge",
    description: "Complete daily challenges to keep your streak alive!",
    icon: Calendar,
    href: "/daily",
    color: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-500/10 group-hover:bg-orange-500/20 dark:bg-orange-500/15 dark:group-hover:bg-orange-500/25",
  },
];

function getSparkyMessage(daysUntilExam: number | null, weakAreas: string[]): string {
  // First priority: weak areas suggestion
  if (weakAreas.length > 0) {
    const categoryNames = weakAreas.map(slug => {
      const cat = CATEGORIES.find(c => c.slug === slug);
      return cat?.name || slug;
    });

    if (weakAreas.length === 1) {
      return `I notice ${categoryNames[0]} could use some extra attention. Let's strengthen that area together! Practice makes perfect.`;
    }
    return `Your weak spots are ${categoryNames.join(" and ")}. Don't worry - focusing on these areas will boost your overall score significantly!`;
  }

  // Second priority: exam countdown
  if (daysUntilExam === null) {
    return "Welcome back! Set your target exam date to get personalized study recommendations and countdown!";
  }

  if (daysUntilExam < 0) {
    return "Your exam date has passed! How did it go? Update your target date if you're planning to retake or celebrate your success!";
  }

  if (daysUntilExam === 0) {
    return "Today's the day! You've put in the work, now trust yourself. Take deep breaths, read each question carefully, and remember - you've got this!";
  }

  if (daysUntilExam === 1) {
    return "One more day! Get a good night's sleep, eat a solid breakfast tomorrow, and arrive early. You're as ready as you'll ever be!";
  }

  if (daysUntilExam <= 3) {
    return "The final stretch! Focus on reviewing your bookmarked questions and weak areas. Light study only - no cramming!";
  }

  if (daysUntilExam <= 7) {
    return "One week to go! This is a great time to take a full mock exam and review any trouble spots. You're doing great!";
  }

  if (daysUntilExam <= 14) {
    return "Two weeks out! Keep up your daily practice and focus on understanding the 'why' behind code requirements. Consistency is key!";
  }

  if (daysUntilExam <= 30) {
    return "A month to go - plenty of time to sharpen your skills! Make sure you're covering all the major NEC articles in your study plan.";
  }

  return "Great job staying consistent with your studies! Remember, every question you practice brings you closer to that Master license!";
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const CATEGORY_COLORS: Record<string, string> = {
  "load-calculations": "#8B5CF6",
  "grounding-bonding": "#10B981",
  "services": "#F59E0B",
  "textbook-navigation": "#3B82F6",
  "chapter-9-tables": "#F97316",
  "box-fill": "#06B6D4",
  "conduit-fill": "#F43F5E",
  "voltage-drop": "#EAB308",
  "motor-calculations": "#6366F1",
  "temperature-correction": "#F87171",
  "resistance": "#14B8A6",
  "transformer-sizing": "#0EA5E9",
};

function CategoryPieChart({ categoryStats }: { categoryStats: CategoryStat[] }) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null);
  const activeSlug = hoveredSlice || hoveredLegend;

  const activeStats = categoryStats.filter((s) => s.answered > 0);
  const totalAnswered = activeStats.reduce((sum, s) => sum + s.answered, 0);

  if (totalAnswered === 0) return null;

  const radius = 70;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  // Build slices
  type Slice = { slug: string; answered: number; accuracy: number; color: string; offset: number; length: number };
  const slices: Slice[] = [];
  let cumulativeOffset = 0;

  for (const stat of activeStats) {
    const proportion = stat.answered / totalAnswered;
    const length = proportion * circumference;
    slices.push({
      slug: stat.slug,
      answered: stat.answered,
      accuracy: stat.accuracy,
      color: CATEGORY_COLORS[stat.slug] || "#94A3B8",
      offset: cumulativeOffset,
      length,
    });
    cumulativeOffset += length;
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Donut Chart */}
      <div className="relative flex-shrink-0">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted dark:text-stone-800"
            strokeWidth={strokeWidth}
          />
          {/* Slices */}
          {slices.map((slice) => {
            const isActive = activeSlug === slice.slug;
            const isOtherActive = activeSlug !== null && activeSlug !== slice.slug;
            return (
              <motion.circle
                key={slice.slug}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${slice.length} ${circumference - slice.length}`}
                strokeDashoffset={-slice.offset}
                strokeLinecap="butt"
                initial={{ strokeDasharray: `0 ${circumference}`, strokeDashoffset: -slice.offset }}
                animate={{
                  strokeDasharray: `${slice.length} ${circumference - slice.length}`,
                  opacity: isOtherActive ? 0.35 : 1,
                }}
                transition={{ duration: 0.8, ease: "easeOut", opacity: { duration: 0.2 } }}
                className="cursor-pointer"
                style={{ filter: isActive ? `drop-shadow(0 0 6px ${slice.color})` : undefined }}
                onMouseEnter={() => setHoveredSlice(slice.slug)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            );
          })}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {totalAnswered}
          </span>
          <span className="text-xs text-muted-foreground">answered</span>
        </div>
        {/* Tooltip */}
        <AnimatePresence>
          {hoveredSlice && (() => {
            const slice = slices.find((s) => s.slug === hoveredSlice);
            if (!slice) return null;
            const cat = CATEGORIES.find((c) => c.slug === slice.slug);
            return (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-stone-900 dark:bg-stone-800 dark:border dark:border-stone-700 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg z-10 pointer-events-none"
              >
                <span className="font-medium">{cat?.name || slice.slug}</span>
                <span className="text-stone-400 ml-1.5">
                  {slice.answered} ({Math.round((slice.answered / totalAnswered) * 100)}%)
                </span>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full space-y-1.5 max-h-[320px] overflow-y-auto overflow-x-hidden">
        {slices.map((slice) => {
          const cat = CATEGORIES.find((c) => c.slug === slice.slug);
          const isActive = activeSlug === slice.slug;
          return (
            <Link
              key={slice.slug}
              href={`/quiz/${slice.slug}`}
              className="block"
              onMouseEnter={() => setHoveredLegend(slice.slug)}
              onMouseLeave={() => setHoveredLegend(null)}
            >
              <motion.div
                animate={{ scale: isActive ? 1.02 : 1, x: isActive ? 4 : 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer pressable ${
                  isActive ? "bg-muted/80 dark:bg-stone-800/80 dark:ring-1 dark:ring-stone-700" : "hover:bg-muted/50 dark:hover:bg-stone-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 transition-shadow duration-200"
                    style={{
                      backgroundColor: slice.color,
                      boxShadow: isActive ? `0 0 8px 2px ${slice.color}` : undefined,
                    }}
                  />
                  <span className="text-sm font-medium text-foreground truncate">
                    {cat?.name || slice.slug}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {slice.answered}
                  </span>
                  <span
                    className={`text-xs font-semibold min-w-[36px] text-right ${
                      slice.accuracy >= 80
                        ? "text-emerald dark:text-sparky-green"
                        : slice.accuracy >= 70
                        ? "text-amber"
                        : "text-red-500"
                    }`}
                  >
                    {slice.accuracy}%
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedFlashcards, setSavedFlashcards] = useState<SavedFlashcard[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [savedQuizProgressList, setSavedQuizProgressList] = useState<SavedQuizProgress[]>([]);
  const [questionsExpanded, setQuestionsExpanded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
      // Check for saved quiz progress across all categories
      const found: SavedQuizProgress[] = [];
      for (const cat of CATEGORIES) {
        try {
          const saved = localStorage.getItem(`sparkypass-quiz-progress-${cat.slug}`);
          if (saved) {
            const parsed = JSON.parse(saved) as SavedQuizProgress;
            if (!parsed.questionIds || !Array.isArray(parsed.questionIds)) continue;
            // Migrate old difficulty names
            const OLD_DIFF_MAP: Record<string, string> = { easy: "apprentice", medium: "journeyman", hard: "master" };
            if (parsed.difficulty && OLD_DIFF_MAP[parsed.difficulty]) {
              parsed.difficulty = OLD_DIFF_MAP[parsed.difficulty];
              localStorage.setItem(`sparkypass-quiz-progress-${cat.slug}`, JSON.stringify(parsed));
            }
            const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
            const hasProgress = parsed.currentQuestionIndex > 0 || Object.keys(parsed.answers || {}).length > 0;
            if (isRecent && hasProgress) {
              found.push(parsed);
            }
          }
        } catch {
          // Ignore invalid localStorage data
        }
      }
      if (found.length > 0) {
        // Sort by most recent first
        found.sort((a, b) => b.timestamp - a.timestamp);
        setSavedQuizProgressList(found);
      }

      // Fetch user data, progress stats, bookmarks, and flashcard bookmarks in parallel
      Promise.all([
        fetch("/api/user").then((res) => res.json()),
        fetch("/api/progress/stats").then((res) => res.json()),
        fetch("/api/bookmarks").then((res) => res.json()),
        fetch("/api/flashcard-bookmarks").then((res) => res.json()),
      ])
        .then(([user, stats, bookmarksData, flashcardBookmarksData]) => {
          setUserData(user);
          setProgressStats(stats);
          // Transform question bookmarks to match expected format
          const questions = (bookmarksData.bookmarks || []).map((b: { id: string; questionId: string; questionText?: string; category?: string; createdAt?: string }) => ({
            id: b.id,
            questionId: b.questionId,
            question: b.questionText || "Unknown question",
            category: b.category || "unknown",
            savedAt: b.createdAt,
          }));
          setSavedQuestions(questions);
          // Set flashcard bookmarks
          setSavedFlashcards(flashcardBookmarksData.bookmarks || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-muted dark:bg-stone-800 rounded w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-muted dark:bg-stone-800 rounded-xl" />
              <div className="h-32 bg-muted dark:bg-stone-800 rounded-xl" />
              <div className="h-32 bg-muted dark:bg-stone-800 rounded-xl" />
            </div>
            <div className="h-48 bg-muted dark:bg-stone-800 rounded-xl mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-muted dark:bg-stone-800 rounded-xl" />
              <div className="h-64 bg-muted dark:bg-stone-800 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const displayName = userData?.username || userData?.name || session?.user?.name || "Electrician";
  const xp = progressStats?.xp ?? userData?.xp ?? 0;
  const level = progressStats?.level ?? userData?.level ?? 1;
  const studyStreak = progressStats?.studyStreak ?? userData?.studyStreak ?? 0;
  const bestStudyStreak = progressStats?.bestStudyStreak ?? 0;
  const dailyChallengeCompleted = progressStats?.dailyChallengeCompleted ?? false;
  const dailyChallengeXpEarned = progressStats?.dailyChallengeXpEarned ?? 0;
  const dailyChallengeXpReward = progressStats?.dailyChallengeXpReward ?? 25;
  const targetExamDate = userData?.targetExamDate
    ? new Date(userData.targetExamDate)
    : null;

  const xpProgress = getXPProgress(xp, level);
  const levelTitle = getLevelTitle(level);

  const daysUntilExam = targetExamDate
    ? Math.ceil(
        (targetExamDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Calculate weak areas (categories below 70% with at least 1 question answered)
  const weakAreas = (progressStats?.categoryStats || [])
    .filter((cat) => cat.answered > 0 && cat.accuracy < 70)
    .map((cat) => cat.slug);

  const sparkyMessage = getSparkyMessage(daysUntilExam, weakAreas);

  const totalAnswered = progressStats?.totalAnswered ?? 0;
  const uniqueQuestionsAnswered = progressStats?.uniqueQuestionsAnswered ?? 0;
  const totalQuestionsInBank = progressStats?.totalQuestionsInBank ?? 50;
  const accuracy = progressStats?.accuracy ?? 0;
  const answeredToday = progressStats?.answeredToday ?? 0;
  const categoryStats = progressStats?.categoryStats ?? [];
  const recentSessions = progressStats?.recentSessions ?? [];

  // Completed quiz sessions with scores, excluding categories that have in-progress saved data
  const savedSlugs = new Set(savedQuizProgressList.map((p) => p.categorySlug));
  const completedSessions = recentSessions.filter(
    (s) =>
      s.questionsAnswered != null &&
      s.questionsAnswered > 0 &&
      s.questionsCorrect != null &&
      s.endedAt != null &&
      !(s.sessionType === "quiz" && s.categorySlug && savedSlugs.has(s.categorySlug))
  );

  const isNewUser = totalAnswered === 0;

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      {/* Blueprint grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-display">
            Welcome back, <span className="text-amber dark:text-sparky-green">{displayName}</span>!
          </h1>
          <p className="text-muted-foreground mb-8">
            Let&apos;s keep the momentum going!
          </p>
        </motion.div>

        {/* Trial Status / Subscription Banner */}
        <div className="mb-6 space-y-3">
          <TrialStatusHeader />
          <SubscriptionBanner />
        </div>

        {/* Daily Challenge Banner */}
        <div className="mb-6">
          <DailyChallengeBanner
            completed={dailyChallengeCompleted}
            studyStreak={studyStreak}
            bestStudyStreak={bestStudyStreak}
            xpReward={dailyChallengeXpReward}
            xpEarned={dailyChallengeXpEarned}
          />
        </div>

        {/* Continue Where You Left Off Banner */}
        {savedQuizProgressList.length > 0 && (() => {
          const mostRecent = savedQuizProgressList[0];
          const cat = CATEGORIES.find((c) => c.slug === mostRecent.categorySlug);
          const answeredCount = Object.keys(mostRecent.answers).length;
          const totalCount = mostRecent.questionIds.length;
          const progressPercent = totalCount > 0
            ? Math.round((mostRecent.currentQuestionIndex / totalCount) * 100)
            : 0;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mb-6"
            >
              <Link href={`/quiz/${mostRecent.categorySlug}?resume=true`}>
                <div className="relative overflow-hidden rounded-xl border border-amber/40 dark:border-amber/30 bg-gradient-to-r from-amber/10 via-amber/5 to-transparent dark:from-amber/10 dark:via-amber/5 dark:to-transparent p-5 group hover:border-amber/60 hover:shadow-[0_0_24px_rgba(245,158,11,0.12)] transition-all cursor-pointer pressable">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber/20 dark:bg-stone-800 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Play className="h-6 w-6 text-amber dark:text-stone-300" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">
                          Continue: {cat?.name || mostRecent.categorySlug}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {answeredCount}/{totalCount} answered
                          {mostRecent.difficulty && (
                            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                              mostRecent.difficulty === "apprentice"
                                ? "bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green"
                                : mostRecent.difficulty === "journeyman"
                                ? "bg-amber/10 text-amber"
                                : "bg-red-500/10 text-red-500"
                            }`}>
                              {mostRecent.difficulty.charAt(0).toUpperCase() + mostRecent.difficulty.slice(1)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-amber font-semibold text-sm">
                      <span className="hidden sm:inline">Pick up where you left off</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4 h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-amber dark:bg-sparky-green rounded-full"
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })()}

        {/* Start Studying - Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4 font-display">
            Start Studying
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              >
                <Link href={feature.href}>
                  <div className="h-full rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 p-5 cursor-pointer group transition-all duration-300 hover:border-amber/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)] dark:hover:border-stone-700 dark:hover:shadow-none pressable">
                    <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-3 transition-all duration-300`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Cards - Core Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Level & XP + Overall Accuracy Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-stone-700 dark:hover:shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber dark:text-amber-light" />
                  Level & XP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-foreground">
                    Level {level}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {levelTitle}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {xp.toLocaleString()} XP
                    </span>
                    <span className="text-muted-foreground">
                      {xpProgress.current} / {xpProgress.needed} to next level
                    </span>
                  </div>
                  <div className="h-3 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpProgress.percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green-dark rounded-full"
                    />
                  </div>
                </div>

                {/* Overall Accuracy */}
                <div className="mt-4 pt-4 border-t border-border dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple dark:text-purple-light" />
                      <span className="text-sm font-medium text-muted-foreground">Overall Accuracy</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">
                      {isNewUser ? "—" : `${accuracy}%`}
                    </span>
                  </div>
                  {isNewUser ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Answer questions to see your accuracy!
                    </p>
                  ) : accuracy >= 80 ? (
                    <p className="text-xs text-emerald dark:text-sparky-green mt-1">
                      Excellent work! Keep it up!
                    </p>
                  ) : accuracy >= 70 ? (
                    <p className="text-xs text-amber mt-1">
                      Good progress! Aim for 80%+
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Keep practicing to improve!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Study Streak + Focus Areas Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-stone-700 dark:hover:shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  Study Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-500/10 dark:bg-orange-500/15 transition-all duration-300">
                    <Flame className="h-7 w-7 text-orange-500 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {studyStreak}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {studyStreak === 1 ? "day" : "days"} in a row
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-muted/50 dark:bg-stone-800/50 text-center">
                    <p className="text-lg font-bold text-foreground">{answeredToday}</p>
                    <p className="text-xs text-muted-foreground">today</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 dark:bg-stone-800/50 text-center">
                    <p className="text-lg font-bold text-foreground">{xp.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">total XP</p>
                  </div>
                </div>

                {/* Focus Areas */}
                <div className="pt-4 border-t border-border dark:border-stone-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber" />
                    <span className="text-sm font-medium text-muted-foreground">Focus Areas</span>
                  </div>
                  {isNewUser ? (
                    <p className="text-xs text-muted-foreground">
                      Complete some quizzes to identify areas for improvement!
                    </p>
                  ) : weakAreas.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald dark:text-stone-400" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">All clear!</p>
                        <p className="text-xs text-muted-foreground">No weak areas detected</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {weakAreas.slice(0, 2).map((slug) => {
                        const category = CATEGORIES.find((c) => c.slug === slug);
                        const stat = categoryStats.find((s) => s.slug === slug);
                        return (
                          <Link key={slug} href={`/quiz/${slug}`}>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-amber/5 hover:bg-amber/10 transition-colors cursor-pointer pressable">
                              <span className="text-sm font-medium text-foreground">
                                {category?.name || slug}
                              </span>
                              <span className="text-sm text-amber font-medium">
                                {stat?.accuracy || 0}%
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to practice
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Exam Countdown Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ExamCountdown
              targetExamDate={targetExamDate}
              totalQuestionsAnswered={uniqueQuestionsAnswered}
              totalQuestionsInBank={totalQuestionsInBank}
            />
          </motion.div>
        </div>

        {/* Sparky Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-8"
        >
          <SparkyMessage size="medium" message={sparkyMessage} />
        </motion.div>

        {/* Saved for Later Section */}
        {(savedFlashcards.length > 0 || savedQuestions.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.52 }}
            className="mb-8"
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-amber dark:text-amber-light" />
                  Saved for Later
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Saved Flashcards */}
                  {savedFlashcards.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald dark:text-stone-400" />
                        Flashcards ({savedFlashcards.length})
                      </h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {savedFlashcards.slice(0, 5).map((card) => (
                          <div
                            key={card.id}
                            className="flex items-start justify-between p-3 rounded-lg bg-muted/50 dark:bg-stone-800/50 group"
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              <p className="text-sm font-medium text-foreground truncate">
                                {card.front}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {card.necReference}
                              </p>
                            </div>
                            <button
                              onClick={async () => {
                                setSavedFlashcards((prev) =>
                                  prev.filter((f) => f.id !== card.id)
                                );
                                try {
                                  await fetch("/api/flashcard-bookmarks", {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ flashcardId: card.flashcardId }),
                                  });
                                } catch (error) {
                                  console.error("Failed to remove flashcard bookmark:", error);
                                }
                              }}
                              className="p-1 rounded-full hover:bg-muted dark:hover:bg-stone-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove from saved"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        ))}
                        {savedFlashcards.length > 5 && (
                          <Link href="/flashcards">
                            <p className="text-sm text-amber hover:underline cursor-pointer pressable">
                              +{savedFlashcards.length - 5} more flashcards
                            </p>
                          </Link>
                        )}
                      </div>
                      <Link href="/flashcards" className="block mt-3">
                        <Button variant="outline" size="sm" className="w-full border-border dark:border-stone-700">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Review Flashcards
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Saved Questions */}
                  {savedQuestions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple" />
                        Quiz Questions ({savedQuestions.length})
                      </h3>
                      <div className={`space-y-2 ${questionsExpanded ? "max-h-[400px]" : "max-h-[300px]"} overflow-y-auto`}>
                        {(questionsExpanded ? savedQuestions : savedQuestions.slice(0, 5)).map((question) => {
                          const category = CATEGORIES.find(
                            (c) => c.slug === question.category
                          );
                          return (
                            <Link
                              key={question.id}
                              href={`/review?question=${question.questionId}`}
                              className="block"
                            >
                              <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50 dark:bg-stone-800/50 group hover:bg-purple/10 dark:hover:bg-purple/10 hover:border-purple/30 border border-transparent transition-colors cursor-pointer pressable">
                                <div className="flex-1 min-w-0 mr-2">
                                  <p className="text-sm font-medium text-foreground truncate group-hover:text-purple transition-colors">
                                    {question.question}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {category?.name || question.category}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-purple group-hover:translate-x-0.5 transition-all" />
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSavedQuestions((prev) =>
                                        prev.filter((q) => q.id !== question.id)
                                      );
                                      try {
                                        await fetch("/api/bookmarks", {
                                          method: "DELETE",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ questionId: question.questionId }),
                                        });
                                      } catch (error) {
                                        console.error("Failed to remove bookmark:", error);
                                      }
                                    }}
                                    className="p-1 rounded-full hover:bg-muted dark:hover:bg-stone-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove from saved"
                                  >
                                    <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                  </button>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      {savedQuestions.length > 5 && (
                        <button
                          onClick={() => setQuestionsExpanded(!questionsExpanded)}
                          className="flex items-center gap-1 text-sm text-purple hover:text-purple/80 mt-2 transition-colors"
                        >
                          <motion.div
                            animate={{ rotate: questionsExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.div>
                          {questionsExpanded
                            ? "Show less"
                            : `+${savedQuestions.length - 5} more questions`}
                        </button>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 bg-purple hover:bg-purple/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                          onClick={() => {
                            const ids = savedQuestions.map((q) => q.questionId);
                            sessionStorage.setItem("bookmarkReviewIds", JSON.stringify(ids));
                            router.push("/bookmarks/review");
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Quiz Saved Questions ({savedQuestions.length})
                        </Button>
                        <Link href="/review" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full border-border dark:border-stone-700">
                            <Brain className="h-4 w-4 mr-2" />
                            Review Questions
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Category Progress and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple dark:text-purple-light" />
                  Category Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isNewUser ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      No progress yet. Start a quiz to see your category breakdown!
                    </p>
                    <Link href="/quiz">
                      <Button className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">Start a Quiz</Button>
                    </Link>
                  </div>
                ) : (
                  <CategoryPieChart categoryStats={categoryStats} />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber dark:text-amber-light" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedQuizProgressList.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      No quizzes in progress. Start a study session to track your progress!
                    </p>
                    <Link href="/quiz">
                      <Button className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">Start Studying</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedQuizProgressList.map((progress) => {
                      const cat = CATEGORIES.find((c) => c.slug === progress.categorySlug);
                      const answeredCount = Object.keys(progress.answers).length;
                      const totalCount = progress.questionIds.length;
                      const progressPercent = totalCount > 0
                        ? Math.round((progress.currentQuestionIndex / totalCount) * 100)
                        : 0;
                      return (
                        <Link key={progress.categorySlug} href={`/quiz/${progress.categorySlug}?resume=true`} className="block group">
                          <div className="relative overflow-hidden rounded-lg border border-amber/30 dark:border-amber/20 bg-amber/5 dark:bg-amber/5 p-4 group-hover:border-amber/60 group-hover:bg-amber/10 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber/20 dark:bg-stone-800 flex items-center justify-center transition-all duration-300">
                                  <Play className="h-5 w-5 text-amber dark:text-stone-300" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    {cat?.name || progress.categorySlug}
                                    {progress.difficulty && (
                                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                        progress.difficulty === "apprentice"
                                          ? "bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green"
                                          : progress.difficulty === "journeyman"
                                          ? "bg-amber/10 text-amber"
                                          : "bg-red-500/10 text-red-500"
                                      }`}>
                                        {progress.difficulty.charAt(0).toUpperCase() + progress.difficulty.slice(1)}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {answeredCount}/{totalCount} answered · Continue where you left off
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-amber group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            {/* Progress bar */}
                            <div className="mt-3 h-1.5 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber dark:bg-sparky-green rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Completed Sessions */}
                {completedSessions.length > 0 && (
                  <div className={`space-y-2 ${savedQuizProgressList.length > 0 ? "mt-4 pt-4 border-t border-border dark:border-stone-800" : ""}`}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Completed</p>
                    {completedSessions.map((session) => {
                      const categoryName = session.categorySlug
                        ? CATEGORIES.find((c) => c.slug === session.categorySlug)?.name
                        : null;
                      const scorePercent = Math.round(
                        (session.questionsCorrect! / session.questionsAnswered!) * 100
                      );
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-stone-800/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-soft dark:bg-stone-800 flex items-center justify-center transition-all duration-300">
                              <CheckCircle2 className="h-5 w-5 text-emerald dark:text-stone-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {categoryName || session.sessionType}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {session.questionsCorrect}/{session.questionsAnswered} correct · {formatTimeAgo(session.endedAt)}
                              </p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${
                            scorePercent >= 80
                              ? "text-emerald dark:text-sparky-green"
                              : scorePercent >= 60
                              ? "text-amber"
                              : "text-red-500"
                          }`}>
                            {scorePercent}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </div>
    </main>
  );
}
