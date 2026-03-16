"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Share2,
  ChevronDown,
  ChevronUp,
  Book,
  CheckCircle2,
  XCircle,
  Flame,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { VoltageUpModal } from "@/components/reward-system";
import { getQuestionById } from "@/lib/questions";
import { useNecVersion, getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import { getCategoryBySlug, type Question, type CategorySlug, type Difficulty } from "@/types/question";
import { PASS_THRESHOLD } from "@/lib/watts";

// Sparky messages based on score percentage
const CELEBRATION_MESSAGES = [
  "INCREDIBLE! You crushed it! 🎉 You're absolutely ready for that Master exam!",
  "Outstanding work! You're showing Master-level knowledge! Keep this up!",
  "WOW! I'm so proud of you! That score shows real dedication and expertise!",
  "Fantastic! You're lighting up the path to success! Almost there, future Master!",
];

const ENCOURAGEMENT_MESSAGES = [
  "Great job! You're building solid knowledge. Keep practicing those tricky areas!",
  "Nice work! You've got a good foundation. A bit more practice and you'll ace it!",
  "Good effort! You're making real progress. Let's strengthen those weak spots!",
  "Well done! You're on the right track. Review the missed ones and you'll be golden!",
];

const SUPPORTIVE_MESSAGES = [
  "Don't worry - every expert was once a beginner. Review these concepts and try again!",
  "This is how we learn! Each missed question is a chance to grow stronger. You've got this!",
  "Rome wasn't built in a day, and neither is mastery! Let's review and come back stronger!",
  "It's okay! The important thing is you're practicing. Let's focus on these topics and improve!",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Fire particle component with physics-based movement
function FireParticle({ delay, startX, size }: { delay: number; startX: number; size: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "text-2xl", md: "text-4xl", lg: "text-5xl" };
  const duration = size === "lg" ? 3 : size === "md" ? 2.5 : 2;

  // Generate random physics-based curve control points
  const swayAmount = 30 + Math.random() * 40;
  const swayDirection = Math.random() > 0.5 ? 1 : -1;

  return (
    <motion.div
      className={`absolute ${sizeClasses[size]} pointer-events-none`}
      style={{ filter: "drop-shadow(0 0 8px rgba(255, 150, 0, 0.8))" }}
      initial={{
        bottom: -50,
        left: `${startX}%`,
        opacity: 1,
        scale: size === "lg" ? 1.2 : size === "md" ? 1 : 0.8,
        rotate: 0,
      }}
      animate={{
        bottom: "110%",
        opacity: [1, 1, 0.9, 0.7, 0],
        scale: [1, 1.4, 1.2, 0.9, 0.6],
        x: [
          0,
          swayDirection * swayAmount * 0.3,
          swayDirection * -swayAmount * 0.5,
          swayDirection * swayAmount * 0.8,
          swayDirection * -swayAmount * 0.2,
        ],
        rotate: [0, swayDirection * 10, swayDirection * -15, swayDirection * 20, 0],
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom physics-like easing
      }}
    >
      🔥
    </motion.div>
  );
}

// Orange screen glow overlay
function FireGlow({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              boxShadow: "inset 0 0 150px 50px rgba(255, 100, 0, 0.3)",
            }}
            animate={{
              boxShadow: [
                "inset 0 0 100px 30px rgba(255, 100, 0, 0.2)",
                "inset 0 0 180px 60px rgba(255, 120, 0, 0.4)",
                "inset 0 0 120px 40px rgba(255, 80, 0, 0.25)",
                "inset 0 0 160px 55px rgba(255, 100, 0, 0.35)",
                "inset 0 0 100px 30px rgba(255, 100, 0, 0.2)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: 1,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fire animation overlay component
function FireAnimation({ show }: { show: boolean }) {
  // Create varied fire particles with different sizes
  const fireParticles = Array.from({ length: 25 }, (_, i) => ({
    id: `fire-${i}`,
    delay: i * 0.08,
    startX: 2 + (i * 3.8) + (Math.random() * 2 - 1),
    size: i % 5 === 0 ? "lg" : i % 3 === 0 ? "md" : "sm" as "sm" | "md" | "lg",
  }));

  return (
    <>
      <FireGlow show={show} />
      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {fireParticles.map((particle) => (
              <FireParticle
                key={particle.id}
                delay={particle.delay}
                startX={particle.startX}
                size={particle.size}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

interface QuizResultData {
  answers: Record<string, number>;
  questionIds: string[];
  categorySlug: CategorySlug;
  bookmarkedQuestions: string[];
  bestStreak: number;
}

interface IncorrectQuestion {
  question: Question;
  selectedAnswer: number;
}

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as CategorySlug;
  const { necVersion } = useNecVersion();

  const [resultData, setResultData] = useState<QuizResultData | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [sparkyMessage, setSparkyMessage] = useState("");
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [showVoltageUpModal, setShowVoltageUpModal] = useState(false);
  const [voltageUpInfo, setVoltageUpInfo] = useState<{ newTitle: string; message: string } | null>(null);
  const [showFireAnimation, setShowFireAnimation] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [bestPercentage, setBestPercentage] = useState<number | null>(null);
  const [unlockedNext, setUnlockedNext] = useState<{ difficulty: Difficulty; label: string } | null>(null);

  const category = useMemo(() => getCategoryBySlug(categorySlug), [categorySlug]);

  // Fetch username for share text
  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.username) setUsername(data.username);
      })
      .catch(() => {});
  }, []);

  // Load quiz data from sessionStorage and fetch user XP
  useEffect(() => {
    const answersStr = sessionStorage.getItem("quizAnswers");
    const questionIdsStr = sessionStorage.getItem("quizQuestionIds");
    const storedCategorySlug = sessionStorage.getItem("quizCategory");
    const bookmarkedStr = sessionStorage.getItem("bookmarkedQuestions");
    const bestStreakStr = sessionStorage.getItem("bestStreak");
    const difficultyStr = sessionStorage.getItem("quizDifficulty");
    if (difficultyStr) setDifficulty(difficultyStr);

    if (!answersStr || !questionIdsStr || storedCategorySlug !== categorySlug) {
      // No quiz data found or category mismatch - redirect to quiz selection
      router.replace("/quiz");
      return;
    }

    const data: QuizResultData = {
      answers: JSON.parse(answersStr),
      questionIds: JSON.parse(questionIdsStr),
      categorySlug: storedCategorySlug as CategorySlug,
      bookmarkedQuestions: bookmarkedStr ? JSON.parse(bookmarkedStr) : [],
      bestStreak: bestStreakStr ? parseInt(bestStreakStr, 10) : 0,
    };

    setResultData(data);
  }, [categorySlug, router]);

  // Calculate results when data is loaded
  const results = useMemo(() => {
    if (!resultData) return null;

    const questions = resultData.questionIds
      .map((id) => getQuestionById(id))
      .filter((q): q is Question => q !== undefined);

    let correctCount = 0;
    const incorrectQuestions: IncorrectQuestion[] = [];

    questions.forEach((question) => {
      const selectedAnswer = resultData.answers[question.id];
      if (selectedAnswer === question.correctAnswer) {
        correctCount++;
      } else {
        incorrectQuestions.push({ question, selectedAnswer });
      }
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Watts calculations from sessionStorage (pre-calculated by quiz page)
    const storedFinalWatts = sessionStorage.getItem("quizFinalWatts");
    const storedPassed = sessionStorage.getItem("quizPassed");
    const passed = storedPassed === "true" || percentage >= (PASS_THRESHOLD * 100);
    const totalWatts = storedFinalWatts ? parseInt(storedFinalWatts, 10) : 0;

    return {
      correctCount,
      totalQuestions,
      percentage,
      passed,
      totalWatts,
      incorrectQuestions,
    };
  }, [resultData, difficulty]);

  // Set Sparky message, fire animation, save result, and check for level-up
  useEffect(() => {
    if (!results || !resultData) return;

    let messages: string[];
    if (results.percentage >= 90) {
      messages = CELEBRATION_MESSAGES;
    } else if (results.percentage >= 70) {
      messages = ENCOURAGEMENT_MESSAGES;
    } else {
      messages = SUPPORTIVE_MESSAGES;
    }

    setSparkyMessage(getRandomMessage(messages));

    // Fire animation for passing scores (80%+)
    if (results.percentage >= 80) {
      setTimeout(() => {
        setShowFireAnimation(true);
      }, 300);
    }

    // Trigger XP animation
    setShowXpAnimation(true);

    // Save quiz result to database, then fetch best score and unlock status
    fetch("/api/quiz-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categorySlug: resultData.categorySlug,
        score: results.correctCount,
        totalQuestions: results.totalQuestions,
        bestStreak: resultData.bestStreak,
        difficulty,
      }),
    })
      .then(() => {
        const params = new URLSearchParams({ category: resultData.categorySlug });
        if (difficulty) params.set("difficulty", difficulty);
        // Fetch best score and unlock status in parallel
        return Promise.all([
          fetch(`/api/quiz-results/best?${params}`).then((res) => res.ok ? res.json() : null),
          fetch(`/api/quiz-results/unlocks?category=${encodeURIComponent(resultData.categorySlug)}`).then((res) => res.ok ? res.json() : null),
        ]);
      })
      .then(([bestData, unlockData]) => {
        if (bestData?.bestPercentage !== null && bestData?.bestPercentage !== undefined) {
          setBestPercentage(bestData.bestPercentage);
        }
        // Check if the next difficulty is now unlocked
        if (unlockData && difficulty) {
          const nextMap: Record<string, { key: Difficulty; label: string }> = {
            journeyman: { key: "master", label: "Master" },
          };
          const next = nextMap[difficulty];
          if (next && unlockData[next.key]?.unlocked) {
            setUnlockedNext({ difficulty: next.key, label: next.label });
          }
        }
      })
      .catch((err) => console.error("Failed to save/fetch quiz result:", err));

  }, [results, resultData]);

  const toggleQuestionExpand = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleRetakeQuiz = () => {
    // Clear session storage and go back to quiz
    sessionStorage.removeItem("quizAnswers");
    sessionStorage.removeItem("quizQuestionIds");
    sessionStorage.removeItem("quizCategory");
    sessionStorage.removeItem("bookmarkedQuestions");
    sessionStorage.removeItem("bestStreak");
    sessionStorage.removeItem("quizDifficulty");
    sessionStorage.removeItem("quizAnswerVoltages");
    sessionStorage.removeItem("quizPassed");
    sessionStorage.removeItem("quizFinalWatts");
    router.push(`/quiz/${categorySlug}`);
  };

  const handleBackToCategories = () => {
    // Clear session storage
    sessionStorage.removeItem("quizAnswers");
    sessionStorage.removeItem("quizQuestionIds");
    sessionStorage.removeItem("quizCategory");
    sessionStorage.removeItem("bookmarkedQuestions");
    sessionStorage.removeItem("bestStreak");
    sessionStorage.removeItem("quizDifficulty");
    router.push("/quiz");
  };

  const handleShare = async () => {
    if (!results || !category) return;

    const usernameTag = username ? ` @${username}` : "";
    const shareText = `I scored ${results.percentage}% on the ${category.name} quiz in SparkyPass!${usernameTag} 🎉⚡`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My SparkyPass Quiz Score",
          text: shareText,
        });
      } catch {
        // User cancelled or share failed - do nothing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Score copied to clipboard!");
      } catch {
        // Clipboard access denied
      }
    }
  };

  const handleTakeNextLevel = () => {
    sessionStorage.removeItem("quizAnswers");
    sessionStorage.removeItem("quizQuestionIds");
    sessionStorage.removeItem("quizCategory");
    sessionStorage.removeItem("bookmarkedQuestions");
    sessionStorage.removeItem("bestStreak");
    sessionStorage.removeItem("quizDifficulty");
    sessionStorage.removeItem("quizAnswerVoltages");
    sessionStorage.removeItem("quizPassed");
    sessionStorage.removeItem("quizFinalWatts");
    router.push(`/quiz/${categorySlug}`);
  };

  // Loading state
  if (!resultData || !results || !category) {
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
        <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
          <div className="animate-pulse">
            <div className="h-8 bg-muted dark:bg-stone-800 rounded w-1/3 mb-6" />
            <div className="h-64 bg-muted dark:bg-stone-800 rounded mb-6" />
          </div>
        </div>
      </main>
    );
  }

  const scoreColor =
    results.percentage >= 80
      ? "text-emerald dark:text-sparky-green"
      : results.percentage >= 60
      ? "text-amber"
      : "text-red-500";

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
      <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
      {/* Fire Animation for passing scores */}
      <FireAnimation show={showFireAnimation} />

      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber/20 dark:bg-sparky-green/20 mb-4"
        >
          <Trophy className="h-10 w-10 text-amber dark:text-sparky-green" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2"
        >
          Quiz Complete!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2"
        >
          <p className="text-muted-foreground">
            {category.name} - {category.necArticle}
          </p>
          {difficulty && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              difficulty === "apprentice"
                ? "bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green"
                : difficulty === "journeyman"
                ? "bg-amber/10 text-amber"
                : "bg-red-500/10 text-red-500"
            }`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          )}
        </motion.div>
      </div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="mb-6 border-2 border-amber/30 dark:border-sparky-green/30 bg-card dark:bg-stone-900/50">
          <CardContent className="pt-6">
            <div className="text-center">
              {/* Score Display */}
              <div className="mb-4">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
                  className={`text-5xl md:text-6xl font-bold ${scoreColor}`}
                >
                  {results.correctCount}/{results.totalQuestions}
                </motion.span>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className={`text-2xl md:text-3xl font-semibold ${scoreColor}`}
                >
                  {results.percentage}%
                </motion.p>
              </div>

              {/* Watts Display */}
              {showXpAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", bounce: 0.4 }}
                  className="flex flex-col items-center gap-2"
                >
                  {difficulty && (
                    <p className={`text-sm font-semibold ${
                      difficulty === "apprentice"
                        ? "text-emerald dark:text-sparky-green"
                        : difficulty === "master"
                        ? "text-red-500"
                        : "text-amber"
                    }`}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} · {results.passed ? "Passed" : "Failed"}
                    </p>
                  )}
                  <div className="flex items-center gap-4 justify-center flex-wrap">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber/20 text-amber rounded-full text-lg font-bold">
                      <Zap className="h-5 w-5" />
                      {results.correctCount}A × V = +{results.totalWatts}W
                    </span>
                    {!results.passed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-full text-sm font-medium">
                        ½ watts (below 70%)
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Total: <span className="font-bold text-amber">{results.totalWatts} W</span>
                  </p>
                </motion.div>
              )}

              {/* Best Streak Display */}
              {resultData.bestStreak >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.9, type: "spring", bounce: 0.5 }}
                  className="mt-4"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-500 rounded-full text-lg font-bold">
                    <Flame className="h-5 w-5" />
                    Best Streak: {resultData.bestStreak} 🔥
                  </span>
                </motion.div>
              )}

              {/* Personal Best Display */}
              {bestPercentage !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="mt-4"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple/20 text-purple dark:bg-sparky-green/15 dark:text-sparky-green rounded-full text-sm font-bold">
                    <Trophy className="h-4 w-4" />
                    Personal Best{difficulty ? ` (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})` : ""}: {bestPercentage}%
                  </span>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sparky Message */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8"
      >
        <SparkyMessage message={sparkyMessage} size="large" variant={results.percentage < 70 ? "sad" : "default"} />
      </motion.div>

      {/* King Sparky Master Quiz Congratulation */}
      {difficulty === "master" && results.percentage >= 70 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.0, type: "spring", damping: 14, stiffness: 180 }}
          className="mb-8"
        >
          <Card className="border-red-500/40 bg-gradient-to-br from-red-500/5 via-amber/5 to-amber/10 dark:from-red-500/10 dark:via-amber/5 dark:to-amber/10 overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-col items-center text-center gap-3">
                <motion.img
                  src="/king-sparky.svg"
                  alt="King Sparky"
                  className="h-24 w-24"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div>
                  <p className="font-bold text-red-500 text-sm uppercase tracking-wide">
                    Master Electrician
                  </p>
                  <p className="text-foreground font-display text-lg">
                    {results.percentage >= 90
                      ? "Flawless mastery! You command the NEC like a true king!"
                      : results.percentage >= 80
                      ? "Outstanding! You've conquered the Master level!"
                      : "You passed the Master challenge! The crown suits you!"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Scoring {results.percentage}% on Master difficulty is no small feat.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Next Level Unlocked Banner */}
      {unlockedNext && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.2, type: "spring", damping: 14, stiffness: 180 }}
          className="mb-8"
        >
          <Card className="border-amber/50 dark:border-sparky-green/50 bg-gradient-to-br from-amber/5 to-amber/10 dark:from-sparky-green/5 dark:to-sparky-green/10 overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-col items-center text-center gap-3">
                <motion.img
                  src="/streak-sparky.svg"
                  alt="Sparky celebrating"
                  className="h-20 w-20"
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                />
                <div>
                  <p className="font-bold text-amber dark:text-sparky-green text-sm">
                    Level Unlocked!
                  </p>
                  <p className="text-foreground font-display text-lg">
                    You unlocked {unlockedNext.label}!
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Your score earned you access to the next difficulty.
                  </p>
                </div>
                <Button
                  onClick={handleTakeNextLevel}
                  size="sm"
                  className="bg-amber hover:bg-amber-dark text-white gap-2 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                >
                  Take {unlockedNext.label} Quiz
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Incorrect Questions Review */}
      {results.incorrectQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="mb-6 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <XCircle className="h-5 w-5 text-red-500" />
                Review Missed Questions ({results.incorrectQuestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.incorrectQuestions.map(({ question, selectedAnswer }) => {
                  const isExpanded = expandedQuestions.has(question.id);
                  return (
                    <div
                      key={question.id}
                      className="border border-border dark:border-stone-700 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestionExpand(question.id)}
                        className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-muted/50 dark:hover:bg-stone-800/50 transition-colors"
                      >
                        <div className="flex-1">
                          <span className="text-xs text-purple font-medium">
                            {getNecReference(question, necVersion)}
                          </span>
                          <p className="text-sm text-foreground mt-1 line-clamp-2">
                            {question.questionText}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border dark:border-stone-700 bg-muted/30 dark:bg-stone-800/30"
                        >
                          <div className="p-4 space-y-3">
                            {/* Your Answer */}
                            <div>
                              <p className="text-xs font-medium text-red-500 mb-1">Your Answer:</p>
                              <p className="text-sm text-muted-foreground">
                                {String.fromCharCode(65 + selectedAnswer)}. {question.options[selectedAnswer]}
                              </p>
                            </div>

                            {/* Correct Answer */}
                            <div>
                              <p className="text-xs font-medium text-emerald dark:text-sparky-green mb-1">Correct Answer:</p>
                              <p className="text-sm text-foreground">
                                {String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}
                              </p>
                            </div>

                            {/* Explanation */}
                            <div className="p-3 bg-muted dark:bg-stone-800 rounded-lg">
                              <div className="flex items-center gap-2 text-xs font-medium text-purple mb-2">
                                <Book className="h-3.5 w-3.5" />
                                Explanation
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {getExplanation(question, necVersion)}
                              </p>
                            </div>

                            {/* Sparky Tip */}
                            <div className="p-3 bg-amber/10 dark:bg-sparky-green/10 rounded-lg border border-amber/30 dark:border-sparky-green/30">
                              <p className="text-sm text-foreground">
                                <span className="font-medium text-amber dark:text-sparky-green">💡 Sparky&apos;s Tip:</span>{" "}
                                {getSparkyTip(question, necVersion)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button
          onClick={handleBackToCategories}
          variant="outline"
          size="lg"
          className="gap-2 border-border dark:border-stone-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Button>

        <Button
          onClick={handleRetakeQuiz}
          size="lg"
          className="bg-amber hover:bg-amber-dark text-white gap-2 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 dark:shadow-[0_0_20px_rgba(163,255,0,0.2)]"
        >
          <RotateCcw className="h-4 w-4" />
          Retake Quiz
        </Button>

        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
          className="gap-2 border-border dark:border-stone-700"
        >
          <Share2 className="h-4 w-4" />
          Share Score
        </Button>
      </motion.div>

      {/* Voltage Up Modal */}
      {voltageUpInfo && (
        <VoltageUpModal
          isOpen={showVoltageUpModal}
          onClose={() => setShowVoltageUpModal(false)}
          newTitle={voltageUpInfo.newTitle}
          message={voltageUpInfo.message}
        />
      )}
      </div>
    </main>
  );
}
