"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  ShieldAlert,
  BookOpen,
  Brain,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CategoryDetail {
  slug: string;
  name: string;
  necArticle: string;
  description: string;
  accuracy: number;
  totalAnswered: number;
  totalCorrect: number;
  totalQuestions: number;
  srsHealth: number;
  srsDue: number;
  srsTotal: number;
  recentAccuracy: number | null;
  prevAccuracy: number | null;
  trend: number | null;
  masteryBreakdown: {
    mastered: number;
    learning: number;
    reviewing: number;
    new: number;
    unattempted: number;
  };
  recentQuizzes: {
    score: number;
    totalQuestions: number;
    difficulty: string | null;
    completedAt: string | null;
    percentage: number;
  }[];
  breaker: {
    isTripped: boolean;
    currentStreak: number;
    bestStreak: number;
    totalTrips: number;
  } | null;
}

interface ArticleDetailProps {
  categorySlug: string;
  onClose: () => void;
}

export function ArticleDetail({ categorySlug, onClose }: ArticleDetailProps) {
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/power-grid/${categorySlug}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categorySlug]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="flex justify-center py-12"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </motion.div>
    );
  }

  if (!data) return null;

  const masteryTotal =
    data.masteryBreakdown.mastered +
    data.masteryBreakdown.learning +
    data.masteryBreakdown.reviewing +
    data.masteryBreakdown.new +
    data.masteryBreakdown.unattempted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border dark:border-stone-800">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-foreground">{data.name}</h3>
              <p className="text-sm text-muted-foreground">{data.necArticle}</p>
              <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{data.accuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{data.totalAnswered}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{data.srsHealth}%</p>
              <p className="text-xs text-muted-foreground">SRS Health</p>
            </div>
          </div>

          {/* Trend */}
          {data.trend !== null && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              {data.trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald dark:text-sparky-green" />
              ) : data.trend < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={data.trend > 0 ? "text-emerald dark:text-sparky-green" : data.trend < 0 ? "text-red-500" : "text-muted-foreground"}>
                {data.trend > 0 ? "+" : ""}
                {data.trend}% vs last week
              </span>
              {data.recentAccuracy !== null && (
                <span className="text-muted-foreground">
                  (this week: {data.recentAccuracy}%)
                </span>
              )}
            </div>
          )}

          {/* Mastery breakdown bar */}
          <div className="mb-4">
            <p className="text-xs font-medium text-foreground mb-2">Question Mastery</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800">
              {data.masteryBreakdown.mastered > 0 && (
                <div
                  className="bg-emerald dark:bg-sparky-green"
                  style={{ width: `${(data.masteryBreakdown.mastered / masteryTotal) * 100}%` }}
                />
              )}
              {data.masteryBreakdown.learning > 0 && (
                <div
                  className="bg-sky-500"
                  style={{ width: `${(data.masteryBreakdown.learning / masteryTotal) * 100}%` }}
                />
              )}
              {data.masteryBreakdown.reviewing > 0 && (
                <div
                  className="bg-amber"
                  style={{ width: `${(data.masteryBreakdown.reviewing / masteryTotal) * 100}%` }}
                />
              )}
              {data.masteryBreakdown.new > 0 && (
                <div
                  className="bg-purple dark:bg-purple-light"
                  style={{ width: `${(data.masteryBreakdown.new / masteryTotal) * 100}%` }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald dark:bg-sparky-green" />
                Mastered ({data.masteryBreakdown.mastered})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-sky-500" />
                Learning ({data.masteryBreakdown.learning})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber" />
                Reviewing ({data.masteryBreakdown.reviewing})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple dark:bg-purple-light" />
                New ({data.masteryBreakdown.new})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700" />
                Unattempted ({data.masteryBreakdown.unattempted})
              </span>
            </div>
          </div>

          {/* SRS due + breaker */}
          <div className="flex flex-wrap gap-3 mb-4">
            {data.srsDue > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-purple dark:text-purple-light bg-purple/10 px-2.5 py-1 rounded-full">
                <BookOpen className="h-3.5 w-3.5" />
                {data.srsDue} due for review
              </div>
            )}
            {data.breaker?.isTripped && (
              <div className="flex items-center gap-1.5 text-sm text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full">
                <ShieldAlert className="h-3.5 w-3.5" />
                Breaker tripped
              </div>
            )}
            {data.breaker && data.breaker.bestStreak > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                <Flame className="h-3.5 w-3.5" />
                Best streak: {data.breaker.bestStreak}
              </div>
            )}
          </div>

          {/* Recent quizzes */}
          {data.recentQuizzes.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-foreground mb-2">Recent Quizzes</p>
              <div className="space-y-1.5">
                {data.recentQuizzes.slice(0, 5).map((quiz, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded px-3 py-1.5">
                    <span className="capitalize">{quiz.difficulty || "mixed"}</span>
                    <span>
                      {quiz.score}/{quiz.totalQuestions} ({quiz.percentage}%)
                    </span>
                    {quiz.completedAt && (
                      <span>{new Date(quiz.completedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Link href={`/quiz/${data.slug}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                <Brain className="h-4 w-4 mr-1.5" />
                Quiz
              </Button>
            </Link>
            <Link href={`/circuit-breaker/${data.slug}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                <ShieldAlert className="h-4 w-4 mr-1.5" />
                Circuit Breaker
              </Button>
            </Link>
            {data.srsDue > 0 && (
              <Link href="/review" className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  <BookOpen className="h-4 w-4 mr-1.5" />
                  Review
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
