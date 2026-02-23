"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";
import {
  Trophy,
  Star,
  ArrowLeft,
  RotateCcw,
  Share2,
  ChevronDown,
  ChevronUp,
  Book,
  CheckCircle2,
  XCircle,
  BookMarked,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { LevelUpModal, getRandomLevelUpMessage } from "@/components/level";
import { getQuestionById } from "@/lib/questions";
import { CATEGORIES, type Question } from "@/types/question";
import { XP_REWARDS, checkLevelUp } from "@/lib/levels";

const XP_PER_CORRECT_ANSWER = XP_REWARDS.CORRECT_ANSWER;
const XP_QUIZ_COMPLETION_BONUS = XP_REWARDS.QUIZ_COMPLETE;

// Sparky messages based on score percentage
const CELEBRATION_MESSAGES = [
  "INCREDIBLE! You've mastered those bookmarked questions! 🎉 Time to remove some from the list!",
  "Outstanding work! Your review sessions are really paying off! You're ready!",
  "WOW! I'm so proud of you! Those tough questions are no match for you now!",
  "Fantastic! You've turned your weak spots into strengths! Keep it up!",
];

const ENCOURAGEMENT_MESSAGES = [
  "Great progress! You're getting better at these tricky questions. Keep reviewing!",
  "Nice work! A bit more practice and these will be second nature!",
  "Good effort! You're making real progress on your bookmarked questions!",
  "Well done! Keep at it and you'll master every single one!",
];

const SUPPORTIVE_MESSAGES = [
  "That's okay - these are your bookmarked questions for a reason! Keep reviewing them.",
  "Keep going! These are your toughest questions, and practice makes perfect!",
  "Don't give up! Each review brings you closer to mastery. Try again soon!",
  "It's okay! These bookmarks highlight exactly where to focus. You've got this!",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function fireConfetti() {
  haptic("celebration");
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0, y: 0.6 },
    colors: ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB"],
  });
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 1, y: 0.6 },
    colors: ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB"],
  });
}

interface ReviewResultData {
  answers: Record<string, number>;
  questionIds: string[];
}

interface IncorrectQuestion {
  question: Question;
  selectedAnswer: number;
}

export default function BookmarkReviewResultsPage() {
  const router = useRouter();

  const [resultData, setResultData] = useState<ReviewResultData | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [sparkyMessage, setSparkyMessage] = useState("");
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{
    newLevel: number;
    newTitle: string;
    message: string;
  } | null>(null);
  const [previousUserXP, setPreviousUserXP] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Fetch username for share text
  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.username) setUsername(data.username);
      })
      .catch(() => {});
  }, []);

  // Load quiz data from sessionStorage
  useEffect(() => {
    const answersStr = sessionStorage.getItem("quizAnswers");
    const questionIdsStr = sessionStorage.getItem("quizQuestionIds");
    const storedCategory = sessionStorage.getItem("quizCategory");
    const preQuizXPStr = sessionStorage.getItem("preQuizXP");

    if (!answersStr || !questionIdsStr || storedCategory !== "bookmarks") {
      router.replace("/bookmarks");
      return;
    }

    if (preQuizXPStr) {
      setPreviousUserXP(parseInt(preQuizXPStr, 10));
    }

    const data: ReviewResultData = {
      answers: JSON.parse(answersStr),
      questionIds: JSON.parse(questionIdsStr),
    };

    setResultData(data);
  }, [router]);

  // Calculate results
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
    const percentage =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
    const correctXP = correctCount * XP_PER_CORRECT_ANSWER;
    const totalXP = correctXP + XP_QUIZ_COMPLETION_BONUS;

    return {
      correctCount,
      totalQuestions,
      percentage,
      correctXP,
      totalXP,
      incorrectQuestions,
    };
  }, [resultData]);

  // Set Sparky message, fire confetti, and check for level-up
  useEffect(() => {
    if (!results) return;

    let messages: string[];
    if (results.percentage >= 90) {
      messages = CELEBRATION_MESSAGES;
    } else if (results.percentage >= 70) {
      messages = ENCOURAGEMENT_MESSAGES;
    } else {
      messages = SUPPORTIVE_MESSAGES;
    }

    setSparkyMessage(getRandomMessage(messages));

    if (results.percentage >= 80) {
      setTimeout(() => {
        fireConfetti();
      }, 300);
    }

    setShowXpAnimation(true);

    if (previousUserXP !== null) {
      const newXP = previousUserXP + results.totalXP;
      const levelUpResult = checkLevelUp(previousUserXP, newXP);

      if (levelUpResult) {
        setLevelUpInfo({
          ...levelUpResult,
          message: getRandomLevelUpMessage(),
        });
        setTimeout(() => {
          setShowLevelUpModal(true);
        }, 2000);
      }
    }
  }, [results, previousUserXP]);

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

  const handleRetakeReview = () => {
    sessionStorage.removeItem("quizAnswers");
    sessionStorage.removeItem("quizQuestionIds");
    sessionStorage.removeItem("quizCategory");
    router.push("/bookmarks/review");
  };

  const handleBackToBookmarks = () => {
    sessionStorage.removeItem("quizAnswers");
    sessionStorage.removeItem("quizQuestionIds");
    sessionStorage.removeItem("quizCategory");
    sessionStorage.removeItem("bookmarkReviewIds");
    router.push("/bookmarks");
  };

  const handleShare = async () => {
    if (!results) return;

    const usernameTag = username ? ` @${username}` : "";
    const shareText = `I scored ${results.percentage}% on my SparkyPass bookmark review session!${usernameTag} 🎉⚡`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My SparkyPass Review Score",
          text: shareText,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Score copied to clipboard!");
      } catch {
        // Clipboard access denied
      }
    }
  };

  // Loading state
  if (!resultData || !results) {
    return (
      <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-6 max-w-4xl">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative z-10 animate-pulse">
          <div className="h-8 bg-muted dark:bg-stone-800 rounded w-1/3 mb-6" />
          <div className="h-64 bg-muted dark:bg-stone-800 rounded mb-6" />
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
    <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-6 max-w-4xl">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-4 flex items-center justify-center gap-2 px-3 py-2 bg-amber/10 rounded-lg text-amber text-sm"
      >
        <BookMarked className="h-4 w-4" />
        <span className="font-medium">Bookmark Review Complete</span>
      </motion.div>

      {/* Header */}
      <div className="relative z-10 text-center mb-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber/20 mb-4"
        >
          <Trophy className="h-10 w-10 text-amber" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2"
        >
          Review Complete!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground"
        >
          Bookmark Review Session
        </motion.p>
      </div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="relative z-10"
      >
        <Card className="mb-6 border-2 border-amber/30 bg-card dark:bg-stone-900/50">
          <CardContent className="pt-6">
            <div className="text-center">
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

              {showXpAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", bounce: 0.4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-4 justify-center flex-wrap">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/20 text-emerald dark:bg-sparky-green/20 dark:text-sparky-green rounded-full text-lg font-bold">
                      <CheckCircle2 className="h-5 w-5" />+{results.correctXP} XP
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple/20 text-purple dark:bg-sparky-green/15 dark:text-sparky-green rounded-full text-lg font-bold">
                      <Star className="h-5 w-5" />+{XP_QUIZ_COMPLETION_BONUS}{" "}
                      Completion Bonus
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Total:{" "}
                    <span className="font-bold text-foreground">
                      {results.totalXP} XP
                    </span>
                  </p>
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
        className="relative z-10 mb-8"
      >
        <SparkyMessage message={sparkyMessage} size="large" />
      </motion.div>

      {/* Incorrect Questions Review */}
      {results.incorrectQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="relative z-10"
        >
          <Card className="mb-6 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                Keep Practicing ({results.incorrectQuestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.incorrectQuestions.map(
                  ({ question, selectedAnswer }) => {
                    const isExpanded = expandedQuestions.has(question.id);
                    const category = CATEGORIES.find(
                      (c) => c.slug === question.category
                    );

                    return (
                      <div
                        key={question.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleQuestionExpand(question.id)}
                          className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-muted/50 dark:hover:bg-stone-800/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-purple font-medium">
                                {question.necReference}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {category?.name}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">
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
                            className="border-t bg-muted/30 dark:bg-stone-800/30"
                          >
                            <div className="p-4 space-y-3">
                              <div>
                                <p className="text-xs font-medium text-red-500 mb-1">
                                  Your Answer:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {String.fromCharCode(65 + selectedAnswer)}.{" "}
                                  {question.options[selectedAnswer]}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-medium text-emerald mb-1">
                                  Correct Answer:
                                </p>
                                <p className="text-sm text-foreground">
                                  {String.fromCharCode(
                                    65 + question.correctAnswer
                                  )}
                                  . {question.options[question.correctAnswer]}
                                </p>
                              </div>

                              <div className="p-3 bg-muted dark:bg-stone-800 rounded-lg">
                                <div className="flex items-center gap-2 text-xs font-medium text-purple mb-2">
                                  <Book className="h-3.5 w-3.5" />
                                  Explanation
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {question.explanation}
                                </p>
                              </div>

                              <div className="p-3 bg-amber/10 rounded-lg border border-amber/30">
                                <p className="text-sm text-foreground">
                                  <span className="font-medium text-amber">
                                    Sparky&apos;s Tip:
                                  </span>{" "}
                                  {question.sparkyTip}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  }
                )}
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
        className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button
          onClick={handleBackToBookmarks}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookmarks
        </Button>

        <Button
          onClick={handleRetakeReview}
          size="lg"
          className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Review Again
        </Button>

        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Score
        </Button>
      </motion.div>

      {/* Level Up Modal */}
      {levelUpInfo && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          onClose={() => setShowLevelUpModal(false)}
          newLevel={levelUpInfo.newLevel}
          newTitle={levelUpInfo.newTitle}
          message={levelUpInfo.message}
        />
      )}
    </main>
  );
}
