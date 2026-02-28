"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Trash2,
  Loader2,
  Brain,
  Zap,
  AlertTriangle,
  BookMarked,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  Timer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";
import { getQuestionById } from "@/lib/questions";
import { useNecVersion, getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import { getScaffolding } from "@/lib/voltage";
import type { Question } from "@/types/question";
import type { VoltageTier } from "@/types/reward-system";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DueQuestion {
  questionId: string;
  category: string;
  difficulty: string;
  easeFactor: number;
  interval: number;
  overdueDays: number;
  timesCorrect: number;
  timesWrong: number;
  lastReviewDate: string | null;
  priority: number;
}

interface SavedQuestion {
  id: string;
  questionId: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  necReference: string;
  sparkyTip?: string;
  category: string;
  difficulty: string;
  createdAt: string;
}

type ReviewTab = "srs" | "saved";

// ─── Messages ───────────────────────────────────────────────────────────────

const SRS_CORRECT_MESSAGES = [
  "Memory reinforced! Your spaced repetition is working perfectly! ⚡",
  "Nailed it! That knowledge is sticking like solder to copper!",
  "Correct! This one will come back later — you've earned a longer break from it!",
  "Right again! Your neural pathways for this topic are getting stronger!",
  "Perfect recall! This question's interval just got longer.",
];

const SRS_INCORRECT_MESSAGES = [
  "That's okay — this question will come back sooner so you can master it!",
  "Not quite. The SRS system just scheduled this for an earlier review. You'll get it next time!",
  "Learning in progress! This one's been flagged for more frequent practice.",
  "Close! Don't worry — repetition is the key. You'll see this one again soon.",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen bg-cream dark:bg-stone-950">
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-amber" />
          </div>
        </main>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}

function ReviewContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<ReviewTab>(
    tabParam === "saved" ? "saved" : "srs"
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <GridBackground />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <GridBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
              <span className="text-emerald dark:text-sparky-green">
                Review Queue
              </span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            {activeTab === "srs"
              ? "Spaced repetition questions — review what you're about to forget!"
              : "Study your saved questions with flip cards."}
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex gap-1 p-1 bg-muted dark:bg-stone-800/50 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("srs")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "srs"
                  ? "bg-white dark:bg-stone-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Due Reviews
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "saved"
                  ? "bg-white dark:bg-stone-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookMarked className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Saved Questions
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === "srs" ? <SRSReviewTab /> : <SavedQuestionsTab />}
      </div>
    </main>
  );
}

// ─── Grid Background ────────────────────────────────────────────────────────

function GridBackground() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  );
}

// ─── SRS Review Tab ─────────────────────────────────────────────────────────

function SRSReviewTab() {
  const { necVersion } = useNecVersion();
  const [dueQuestions, setDueQuestions] = useState<DueQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWattsEarned, setTotalWattsEarned] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [sparkyMessage, setSparkyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voltageTier, setVoltageTier] = useState<VoltageTier>(1);
  const timerRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scaffolding = getScaffolding(voltageTier);

  // Load due questions and user voltage tier
  useEffect(() => {
    async function loadDueQuestions() {
      try {
        const [dueRes, userRes] = await Promise.all([
          fetch("/api/review/due?limit=20"),
          fetch("/api/user"),
        ]);
        if (dueRes.ok) {
          const data = await dueRes.json();
          setDueQuestions(data.questions || []);
        }
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.voltageTier) {
            setVoltageTier(userData.voltageTier as VoltageTier);
          }
        }
      } catch (error) {
        console.error("Failed to load due questions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDueQuestions();
  }, []);

  // Create study session when starting
  useEffect(() => {
    if (dueQuestions.length > 0 && !sessionId && !loading) {
      createSession();
    }
  }, [dueQuestions, loading]);

  // Timer for answer speed tracking
  useEffect(() => {
    if (!isAnswered && !isComplete && dueQuestions.length > 0) {
      timerRef.current = 0;
      timerIntervalRef.current = setInterval(() => {
        timerRef.current += 1;
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentIndex, isAnswered, isComplete, dueQuestions.length]);

  async function createSession() {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionType: "flashcard", categorySlug: null }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }

  async function handleAnswer(answerIndex: number) {
    if (isAnswered || submitting) return;

    const dueQ = dueQuestions[currentIndex];
    const question = getQuestionById(dueQ.questionId);
    if (!question) return;

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    setSubmitting(true);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const isCorrect = answerIndex === question.correctAnswer;
    if (isCorrect) {
      setTotalCorrect((prev) => prev + 1);
      setSparkyMessage(getRandomMessage(SRS_CORRECT_MESSAGES));
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { x: 0.5, y: 0.7 },
        colors: ["#F59E0B", "#10B981", "#8B5CF6"],
      });
    } else {
      setSparkyMessage(getRandomMessage(SRS_INCORRECT_MESSAGES));
    }

    // Submit progress (this updates SRS state on the server)
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: dueQ.questionId,
          isCorrect,
          timeSpentSeconds: timerRef.current,
          difficulty: dueQ.difficulty,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.wattsEarned) {
          setTotalWattsEarned((prev) => prev + data.wattsEarned);
          window.dispatchEvent(new Event("watts-updated"));
        }
      }
    } catch (error) {
      console.error("Failed to submit progress:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (currentIndex >= dueQuestions.length - 1) {
      await completeSession();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setSparkyMessage("");
  }

  async function completeSession() {
    setIsComplete(true);

    if (sessionId) {
      try {
        await fetch("/api/review/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionsReviewed: dueQuestions.length,
            questionsCorrect: totalCorrect,
          }),
        });
        window.dispatchEvent(new Event("watts-updated"));
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }

    // Celebration confetti for completing a review session
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
      colors: ["#F59E0B", "#10B981", "#8B5CF6", "#A3FF00"],
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  // No due questions
  if (dueQuestions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-12 text-center border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CheckCircle2 className="h-16 w-16 text-emerald dark:text-sparky-green mx-auto mb-4" />
          <h2 className="text-xl font-semibold font-display text-foreground mb-2">
            All caught up!
          </h2>
          <p className="text-muted-foreground mb-6">
            No questions are due for review right now. Keep studying and your
            spaced repetition schedule will queue them up!
          </p>
          <Link href="/quiz">
            <Button>
              <Brain className="h-4 w-4 mr-2" />
              Practice New Questions
            </Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  // Session complete
  if (isComplete) {
    const accuracy =
      dueQuestions.length > 0
        ? Math.round((totalCorrect / dueQuestions.length) * 100)
        : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-amber mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">
              Review Session Complete!
            </h2>
            <p className="text-muted-foreground mb-6">
              You reviewed {dueQuestions.length} question
              {dueQuestions.length !== 1 ? "s" : ""}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
              <div className="bg-muted dark:bg-stone-800/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-emerald dark:text-sparky-green">
                  {totalCorrect}
                </p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="bg-muted dark:bg-stone-800/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-foreground">
                  {accuracy}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="bg-muted dark:bg-stone-800/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber flex items-center justify-center gap-1">
                  <Zap className="h-5 w-5" />
                  {totalWattsEarned}
                </p>
                <p className="text-xs text-muted-foreground">Watts Earned</p>
              </div>
            </div>

            <SparkyMessage
              size="medium"
              message={
                accuracy >= 80
                  ? "Outstanding review session! Your spaced repetition is keeping those neural pathways strong! ⚡"
                  : accuracy >= 60
                    ? "Good work! The questions you missed will come back sooner — that's the power of spaced repetition!"
                    : "Keep at it! The SRS system is adapting to help you focus on what needs the most practice."
              }
            />

            <div className="flex gap-3 justify-center mt-6">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/quiz">
                <Button>
                  <Brain className="h-4 w-4 mr-2" />
                  Practice More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Active review — show current question
  const dueQ = dueQuestions[currentIndex];
  const question = getQuestionById(dueQ.questionId);
  const category = CATEGORIES.find((c) => c.slug === dueQ.category);
  const progress = ((currentIndex + 1) / dueQuestions.length) * 100;

  if (!question) {
    // Question not found in bank — skip it
    handleNext();
    return null;
  }

  return (
    <>
      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Question {currentIndex + 1} of {dueQuestions.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-amber" />
            {dueQ.overdueDays > 0
              ? `${dueQ.overdueDays}d overdue`
              : "Due today"}
          </span>
        </div>
        <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-emerald dark:bg-sparky-green rounded-full"
          />
        </div>
      </motion.div>

      {/* SRS Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-wrap gap-2 mb-4"
      >
        <span className="text-xs text-emerald dark:text-sparky-green font-medium px-2 py-0.5 rounded bg-emerald/10 dark:bg-sparky-green/10">
          {category?.name || dueQ.category}
        </span>
        <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded bg-muted dark:bg-stone-800">
          {dueQ.difficulty}
        </span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted dark:bg-stone-800">
          {dueQ.timesCorrect}✓ / {dueQ.timesWrong}✗
        </span>
      </motion.div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <CardContent className="p-6">
              <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed mb-6">
                {question.questionText}
              </p>

              {/* Answer Options */}
              <div className="space-y-3">
                {question.options.map((option, i) => {
                  let optionStyle =
                    "border-border dark:border-stone-700 hover:border-emerald/50 dark:hover:border-sparky-green/50 hover:bg-emerald/5 dark:hover:bg-sparky-green/5";

                  if (isAnswered) {
                    if (i === question.correctAnswer) {
                      optionStyle =
                        "border-emerald dark:border-sparky-green bg-emerald/10 dark:bg-sparky-green/10";
                    } else if (
                      i === selectedAnswer &&
                      i !== question.correctAnswer
                    ) {
                      optionStyle =
                        "border-red-500 bg-red-500/10 dark:border-red-400 dark:bg-red-400/10";
                    } else {
                      optionStyle =
                        "border-border dark:border-stone-700 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionStyle} ${
                        !isAnswered ? "cursor-pointer pressable" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted dark:bg-stone-700 flex items-center justify-center text-sm font-medium text-muted-foreground">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-foreground text-sm md:text-base leading-relaxed">
                          {option}
                        </span>
                        {isAnswered && i === question.correctAnswer && (
                          <CheckCircle2 className="h-5 w-5 text-emerald dark:text-sparky-green flex-shrink-0 ml-auto" />
                        )}
                        {isAnswered &&
                          i === selectedAnswer &&
                          i !== question.correctAnswer && (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 ml-auto" />
                          )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (shown after answer — scaffolding applies) */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-6 pt-6 border-t border-border dark:border-stone-800"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {getExplanation(question, necVersion)}
                  </p>
                  {scaffolding.showNecReferences && (
                    <div className="flex items-center gap-1.5 text-emerald dark:text-sparky-green mb-2">
                      <BookOpen className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        {getNecReference(question, necVersion)}
                      </p>
                    </div>
                  )}
                  {scaffolding.showFormulas && question.sparkyTip && (
                    <div className="flex items-center gap-1.5 text-amber">
                      <Zap className="h-3.5 w-3.5" />
                      <p className="text-xs">
                        {getSparkyTip(question, necVersion)}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Sparky Message + Next Button */}
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="space-y-4"
            >
              {sparkyMessage && (
                <SparkyMessage size="medium" message={sparkyMessage} />
              )}
              <div className="flex justify-center">
                <Button onClick={handleNext} size="lg">
                  {currentIndex < dueQuestions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Finish Review
                      <Trophy className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// ─── Saved Questions Tab (preserved from original) ──────────────────────────

function SavedQuestionsTab() {
  const { necVersion } = useNecVersion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<SavedQuestion | null>(null);

  useEffect(() => {
    async function loadSavedQuestions() {
      try {
        const response = await fetch("/api/bookmarks");
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.bookmarks || []);
        }
      } catch (error) {
        console.error("Failed to load saved questions:", error);
      } finally {
        setLoading(false);
        setQuestionsLoaded(true);
      }
    }
    loadSavedQuestions();
  }, []);

  useEffect(() => {
    const questionParam = searchParams.get("question");
    if (questionParam && questionsLoaded && questions.length > 0) {
      const questionIndex = questions.findIndex(
        (q) => q.questionId === questionParam
      );
      if (questionIndex !== -1) {
        setCurrentIndex(questionIndex);
        setIsFlipped(false);
      }
      router.replace("/review?tab=saved", { scroll: false });
    }
  }, [searchParams, questionsLoaded, questions, router]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleDeleteClick = (question: SavedQuestion) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;

    try {
      await fetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: questionToDelete.questionId }),
      });

      setQuestions((prev) =>
        prev.filter((q) => q.id !== questionToDelete.id)
      );

      if (currentIndex >= questions.length - 1 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      setIsFlipped(false);
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
    } finally {
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-12 text-center border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <BookMarked className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold font-display text-foreground mb-2">
            No saved questions
          </h2>
          <p className="text-muted-foreground mb-6">
            Bookmark questions during quizzes to add them to your review queue.
          </p>
          <Link href="/quiz">
            <Button>
              <Brain className="h-4 w-4 mr-2" />
              Start a Quiz
            </Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const category = currentQuestion
    ? CATEGORIES.find((c) => c.slug === currentQuestion.category)
    : null;

  return (
    <>
      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Card {currentIndex + 1} of {questions.length}
          </span>
          <span className="flex items-center gap-1">
            <BookMarked className="h-3.5 w-3.5 text-emerald dark:text-sparky-green" />
            {questions.length} saved
          </span>
        </div>
        <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-emerald dark:bg-sparky-green rounded-full"
          />
        </div>
      </motion.div>

      {/* Flip Card */}
      {currentQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div
            className="relative min-h-[400px] md:min-h-[450px] cursor-pointer perspective-1000 pressable"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFlipped ? "back" : "front"}
                initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Card
                  className={`h-full flex flex-col ${
                    isFlipped
                      ? "bg-emerald/5 border-emerald/30 dark:bg-sparky-green/5 dark:border-sparky-green/30"
                      : "bg-card dark:bg-stone-900/50 border-border dark:border-stone-800"
                  }`}
                >
                  <CardContent className="flex flex-col h-full p-6">
                    {!isFlipped ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald dark:text-sparky-green font-medium px-2 py-0.5 rounded bg-emerald/10 dark:bg-sparky-green/10">
                              {category?.name || currentQuestion.category}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded bg-muted dark:bg-stone-800">
                              {currentQuestion.difficulty}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(currentQuestion);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <Brain className="h-10 w-10 text-emerald dark:text-sparky-green mb-4" />
                          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                            {currentQuestion.questionText}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground text-center mt-4">
                          Tap to reveal answer
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald dark:text-sparky-green font-medium">
                            Answer
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(currentQuestion);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed mb-3">
                            {
                              currentQuestion.options[
                                currentQuestion.correctAnswer
                              ]
                            }
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {(() => {
                              const q = getQuestionById(
                                currentQuestion.questionId
                              );
                              return q
                                ? getExplanation(q, necVersion)
                                : currentQuestion.explanation;
                            })()}
                          </p>
                          <div className="flex items-center gap-1.5 text-emerald dark:text-sparky-green mb-2">
                            <BookOpen className="h-4 w-4" />
                            <p className="text-sm font-medium">
                              {(() => {
                                const q = getQuestionById(
                                  currentQuestion.questionId
                                );
                                return q
                                  ? getNecReference(q, necVersion)
                                  : currentQuestion.necReference;
                              })()}
                            </p>
                          </div>
                          {currentQuestion.sparkyTip && (
                            <div className="flex items-center gap-1.5 text-amber">
                              <Zap className="h-3.5 w-3.5" />
                              <p className="text-xs">
                                {(() => {
                                  const q = getQuestionById(
                                    currentQuestion.questionId
                                  );
                                  return q
                                    ? getSparkyTip(q, necVersion)
                                    : currentQuestion.sparkyTip;
                                })()}
                              </p>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground text-center mt-4">
                          Tap to see question
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-wrap justify-center gap-3 mb-8"
      >
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="border-border dark:border-stone-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsFlipped(!isFlipped)}
          className="border-border dark:border-stone-700"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Flip
        </Button>
        <Button
          variant="outline"
          onClick={handleShuffle}
          className="border-border dark:border-stone-700"
        >
          <Shuffle className="h-4 w-4 mr-1" />
          Shuffle
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
          className="border-border dark:border-stone-700"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </motion.div>

      {/* Sparky Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SparkyMessage
          size="medium"
          message="These are the questions you saved for later review. Take your time to understand each one - try to recall the answer before flipping!"
        />
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber" />
              Remove from Review Queue?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this question from your saved
              questions? You can always bookmark it again during a quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
