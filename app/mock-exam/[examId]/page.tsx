"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
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
import { getAllQuestions, getQuestionsByDifficulty } from "@/lib/questions";
import type { Question } from "@/types/question";

interface ExamConfig {
  id: string;
  title: string;
  questionCount: number;
  timeLimit: number; // in minutes
  difficulty: "standard" | "challenging";
}

const EXAM_CONFIGS: Record<string, ExamConfig> = {
  "quick-practice": {
    id: "quick-practice",
    title: "Quick Practice",
    questionCount: 25,
    timeLimit: 30,
    difficulty: "standard",
  },
  "half-exam": {
    id: "half-exam",
    title: "Half Exam",
    questionCount: 50,
    timeLimit: 60,
    difficulty: "standard",
  },
  "full-exam": {
    id: "full-exam",
    title: "Full Mock Exam",
    questionCount: 100,
    timeLimit: 120,
    difficulty: "standard",
  },
  "challenge-mode": {
    id: "challenge-mode",
    title: "Challenge Mode",
    questionCount: 50,
    timeLimit: 45,
    difficulty: "challenging",
  },
};

export default function ExamSessionPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const examConfig = EXAM_CONFIGS[examId];

  // Initialize exam
  useEffect(() => {
    if (!examConfig) {
      router.push("/mock-exam");
      return;
    }

    // Get questions based on exam type
    let availableQuestions: Question[];
    if (examConfig.difficulty === "challenging") {
      availableQuestions = getQuestionsByDifficulty("master");
    } else {
      availableQuestions = getAllQuestions();
    }

    // Shuffle and select the required number of questions
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(examConfig.questionCount, shuffled.length));

    setQuestions(selectedQuestions);
    setTimeRemaining(examConfig.timeLimit * 60); // Convert to seconds
    setIsLoading(false);
  }, [examConfig, router]);

  // Timer countdown
  useEffect(() => {
    if (isLoading || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, timeRemaining]);

  const handleSubmitExam = useCallback(() => {
    // Calculate results
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    const totalAnswered = Object.values(answers).filter((a) => a !== null).length;
    const score = Math.round((correct / questions.length) * 100);
    const timeTaken = (examConfig?.timeLimit || 0) * 60 - timeRemaining;

    // Store results in sessionStorage for the results page
    sessionStorage.setItem(
      "examResults",
      JSON.stringify({
        examId,
        examTitle: examConfig?.title,
        questions,
        answers,
        correct,
        total: questions.length,
        totalAnswered,
        score,
        timeTaken,
        flagged: Array.from(flagged),
      })
    );

    router.push(`/mock-exam/${examId}/results`);
  }, [questions, answers, examConfig, timeRemaining, examId, flagged, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    );
  }

  if (!examConfig || questions.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Exam not found</p>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isAnswered = answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== null;
  const isFlagged = flagged.has(currentQuestion.id);
  const answeredCount = Object.values(answers).filter((a) => a !== null).length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleToggleFlag = () => {
    setFlagged((prev) => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(currentQuestion.id)) {
        newFlagged.delete(currentQuestion.id);
      } else {
        newFlagged.add(currentQuestion.id);
      }
      return newFlagged;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleGoToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const isTimeLow = timeRemaining < 300; // Less than 5 minutes

  return (
    <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-4 max-w-4xl">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Header with Timer */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur py-3 mb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
            >
              <X className="h-4 w-4 mr-1" />
              Exit
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {examConfig.title}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {answeredCount}/{questions.length} answered
            </span>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isTimeLow ? "bg-red-500/10 text-red-500" : "bg-amber/10 text-amber dark:bg-sparky-green/10 dark:text-sparky-green"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="font-mono font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Navigation Pills */}
      <div className="relative z-10 mb-6 overflow-x-auto pb-2">
        <div className="flex gap-1.5 min-w-max">
          {questions.map((q, index) => {
            const isActive = index === currentIndex;
            const isQAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
            const isQFlagged = flagged.has(q.id);

            return (
              <button
                key={q.id}
                onClick={() => handleGoToQuestion(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all flex items-center justify-center relative ${
                  isActive
                    ? "bg-amber text-white dark:bg-sparky-green dark:text-stone-950"
                    : isQAnswered
                    ? "bg-emerald/20 text-emerald dark:bg-sparky-green/20 dark:text-sparky-green"
                    : "bg-muted dark:bg-stone-800 text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {index + 1}
                {isQFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10"
      >
        <Card className="mb-6 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFlag}
                className={isFlagged ? "text-red-500" : "text-muted-foreground"}
              >
                <Flag className={`h-4 w-4 mr-1 ${isFlagged ? "fill-current" : ""}`} />
                {isFlagged ? "Flagged" : "Flag"}
              </Button>
            </div>

            <h2 className="text-lg font-medium text-foreground mb-6">
              {currentQuestion.questionText}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index;

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isSelected
                        ? "border-amber bg-amber/10 dark:border-sparky-green dark:bg-sparky-green/10"
                        : "border-border hover:border-amber/50 dark:hover:border-sparky-green/50 hover:bg-muted/50 dark:hover:bg-stone-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          isSelected
                            ? "bg-amber text-white dark:bg-sparky-green dark:text-stone-950"
                            : "bg-muted dark:bg-stone-800 text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-foreground">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="relative z-10 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSubmitDialog(true)}
            className="dark:border-sparky-green/50 dark:text-sparky-green dark:hover:bg-sparky-green/10"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Finish
          </Button>

          {currentIndex < questions.length - 1 && (
            <Button onClick={handleNext} className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-amber">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  {questions.length - answeredCount} questions are unanswered.
                </span>
              )}
              {flagged.size > 0 && (
                <span className="block mt-1 text-red-500">
                  <Flag className="h-4 w-4 inline mr-1" />
                  {flagged.size} questions are flagged for review.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber hover:bg-amber-dark dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
              onClick={handleSubmitExam}
            >
              Submit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost if you exit now. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => router.push("/mock-exam")}
            >
              Exit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
