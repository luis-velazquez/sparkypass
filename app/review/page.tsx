"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    }>
      <ReviewContent />
    </Suspense>
  );
}

function ReviewContent() {
  const { status } = useSession();
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
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load saved questions from database
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
    if (status === "authenticated") {
      loadSavedQuestions();
    }
  }, [status]);

  // Handle query parameter for direct question navigation
  useEffect(() => {
    const questionParam = searchParams.get("question");
    if (questionParam && questionsLoaded && questions.length > 0) {
      const questionIndex = questions.findIndex((q) => q.questionId === questionParam);
      if (questionIndex !== -1) {
        setCurrentIndex(questionIndex);
        setIsFlipped(false);
      }
      // Clear the query param after navigation
      router.replace("/review", { scroll: false });
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

      // Remove from local state
      setQuestions((prev) => prev.filter((q) => q.id !== questionToDelete.id));

      // Adjust current index if needed
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

  if (status === "loading" || loading) {
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
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const category = currentQuestion ? CATEGORIES.find((c) => c.slug === currentQuestion.category) : null;

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
            <span className="text-emerald dark:text-sparky-green">Review Queue</span>
          </h1>
        </div>
        <p className="text-muted-foreground">
          Study your saved questions with flip cards. Tap to reveal the answer!
        </p>
      </motion.div>

      {/* Empty State */}
      {questions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-12 text-center border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <BookMarked className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold font-display text-foreground mb-2">No saved questions</h2>
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
      ) : (
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
                    <Card className={`h-full flex flex-col ${
                      isFlipped
                        ? "bg-emerald/5 border-emerald/30 dark:bg-sparky-green/5 dark:border-sparky-green/30"
                        : "bg-card dark:bg-stone-900/50 border-border dark:border-stone-800"
                    }`}>
                      <CardContent className="flex flex-col h-full p-6">
                        {!isFlipped ? (
                          /* Front - Question */
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
                          /* Back - Answer */
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
                                {currentQuestion.options[currentQuestion.correctAnswer]}
                              </p>
                              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                {currentQuestion.explanation}
                              </p>
                              <div className="flex items-center gap-1.5 text-emerald dark:text-sparky-green mb-2">
                                <BookOpen className="h-4 w-4" />
                                <p className="text-sm font-medium">
                                  {currentQuestion.necReference}
                                </p>
                              </div>
                              {currentQuestion.sparkyTip && (
                                <div className="flex items-center gap-1.5 text-amber">
                                  <Zap className="h-3.5 w-3.5" />
                                  <p className="text-xs">
                                    {currentQuestion.sparkyTip}
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
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber" />
              Remove from Review Queue?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this question from your saved questions?
              You can always bookmark it again during a quiz.
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
      </div>
    </main>
  );
}
