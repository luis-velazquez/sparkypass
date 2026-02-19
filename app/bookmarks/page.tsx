"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookMarked,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Shield,
  Zap,
  Filter,
  Play,
  Navigation,
  Table,
  Box,
  CircleDot,
  Activity,
  Cog,
  Thermometer,
  Omega,
  GitBranch,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES, type CategorySlug, type Question } from "@/types/question";
import { getQuestionById } from "@/lib/questions";

interface Bookmark {
  id: string;
  questionId: string;
  createdAt: string | null;
}

interface BookmarkWithQuestion extends Bookmark {
  question: Question | null;
}

// Map category slugs to icons
const categoryIcons: Record<CategorySlug, typeof BookOpen> = {
  "load-calculations": BookOpen,
  "grounding-bonding": Shield,
  services: Zap,
  "textbook-navigation": Navigation,
  "chapter-9-tables": Table,
  "box-fill": Box,
  "conduit-fill": CircleDot,
  "voltage-drop": Activity,
  "motor-calculations": Cog,
  "temperature-correction": Thermometer,
  "resistance": Omega,
  "transformer-sizing": GitBranch,
  "sizing-requirements": Ruler,
};

// Map category slugs to colors
const categoryColors: Record<CategorySlug, { icon: string; bg: string; badge: string }> = {
  "load-calculations": {
    icon: "text-purple",
    bg: "bg-purple-soft dark:bg-purple/10",
    badge: "bg-purple/10 text-purple",
  },
  "grounding-bonding": {
    icon: "text-emerald",
    bg: "bg-emerald/10",
    badge: "bg-emerald/10 text-emerald",
  },
  services: {
    icon: "text-amber",
    bg: "bg-amber/10",
    badge: "bg-amber/10 text-amber",
  },
  "textbook-navigation": {
    icon: "text-blue-500",
    bg: "bg-blue-500/10",
    badge: "bg-blue-500/10 text-blue-500",
  },
  "chapter-9-tables": {
    icon: "text-orange-500",
    bg: "bg-orange-500/10",
    badge: "bg-orange-500/10 text-orange-500",
  },
  "box-fill": {
    icon: "text-cyan-500",
    bg: "bg-cyan-500/10",
    badge: "bg-cyan-500/10 text-cyan-500",
  },
  "conduit-fill": {
    icon: "text-rose-500",
    bg: "bg-rose-500/10",
    badge: "bg-rose-500/10 text-rose-500",
  },
  "voltage-drop": {
    icon: "text-yellow-500",
    bg: "bg-yellow-500/10",
    badge: "bg-yellow-500/10 text-yellow-500",
  },
  "motor-calculations": {
    icon: "text-indigo-500",
    bg: "bg-indigo-500/10",
    badge: "bg-indigo-500/10 text-indigo-500",
  },
  "temperature-correction": {
    icon: "text-red-500",
    bg: "bg-red-500/10",
    badge: "bg-red-500/10 text-red-500",
  },
  "resistance": {
    icon: "text-teal-500",
    bg: "bg-teal-500/10",
    badge: "bg-teal-500/10 text-teal-500",
  },
  "transformer-sizing": {
    icon: "text-sky-500",
    bg: "bg-sky-500/10",
    badge: "bg-sky-500/10 text-sky-500",
  },
  "sizing-requirements": {
    icon: "text-lime-500",
    bg: "bg-lime-500/10",
    badge: "bg-lime-500/10 text-lime-500",
  },
};

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  async function fetchBookmarks() {
    try {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      const data = await res.json();

      // Enrich bookmarks with question data
      const enrichedBookmarks: BookmarkWithQuestion[] = data.bookmarks.map(
        (b: Bookmark) => ({
          ...b,
          question: getQuestionById(b.questionId) || null,
        })
      );

      setBookmarks(enrichedBookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function removeBookmark(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove bookmark");
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (error) {
      console.error("Error removing bookmark:", error);
    } finally {
      setRemovingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function startReviewSession() {
    // Store bookmarked question IDs in sessionStorage for quiz
    const questionIds = filteredBookmarks
      .filter((b) => b.question)
      .map((b) => b.questionId);

    if (questionIds.length > 0) {
      sessionStorage.setItem("bookmarkReviewIds", JSON.stringify(questionIds));
      router.push("/bookmarks/review");
    }
  }

  // Filter bookmarks by category
  const filteredBookmarks = bookmarks.filter((b) => {
    if (categoryFilter === "all") return true;
    return b.question?.category === categoryFilter;
  });

  // Get category counts for filter
  const categoryCounts = bookmarks.reduce(
    (acc, b) => {
      if (b.question?.category) {
        acc[b.question.category] = (acc[b.question.category] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Loading skeleton
  if (loading) {
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
        <div className="relative z-10 mb-8 space-y-2">
          <div className="h-8 w-48 bg-muted dark:bg-stone-800 animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted dark:bg-stone-800 animate-pulse rounded" />
        </div>
        <div className="relative z-10 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted dark:bg-stone-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </main>
    );
  }

  // Empty state
  if (bookmarks.length === 0) {
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
            Your <span className="text-amber dark:text-sparky-green">Bookmarks</span>
          </h1>
          <p className="text-muted-foreground">
            Save questions during quizzes to review them later.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 flex flex-col items-center justify-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-amber/10 flex items-center justify-center mb-6">
            <BookMarked className="h-10 w-10 text-amber" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Bookmarks Yet
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            When you take quizzes, you can bookmark questions to review later.
            Look for the star icon on any question!
          </p>
          <Button onClick={() => router.push("/quiz")} className="bg-amber hover:bg-amber-dark text-white">
            Start a Quiz
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative z-10 mt-8"
        >
          <SparkyMessage
            size="medium"
            message="Don't worry, everyone starts somewhere! Take a quiz and bookmark the questions that challenge you. They'll be waiting here for you to review and conquer!"
          />
        </motion.div>
      </main>
    );
  }

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
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
          Your <span className="text-amber dark:text-sparky-green">Bookmarks</span>
        </h1>
        <p className="text-muted-foreground">
          Review and study your saved questions. You have {bookmarks.length}{" "}
          {bookmarks.length === 1 ? "bookmark" : "bookmarks"} saved.
        </p>
      </motion.div>

      {/* Controls Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 flex flex-col sm:flex-row gap-4 mb-6"
      >
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({bookmarks.length})</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name} ({categoryCounts[cat.slug] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Review Session Button */}
        {filteredBookmarks.length > 0 && (
          <Button
            onClick={startReviewSession}
            className="bg-purple hover:bg-purple/90 sm:ml-auto"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Review Session ({filteredBookmarks.length})
          </Button>
        )}
      </motion.div>

      {/* Bookmarks List */}
      <div className="relative z-10 space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredBookmarks.map((bookmark, index) => {
            if (!bookmark.question) return null;

            const question = bookmark.question;
            const Icon = categoryIcons[question.category];
            const colors = categoryColors[question.category];
            const isExpanded = expandedId === bookmark.id;
            const isRemoving = removingId === bookmark.id;

            return (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, height: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <Card className="overflow-hidden border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]">
                  {/* Collapsed View */}
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Category Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}
                      >
                        <Icon className={`h-5 w-5 ${colors.icon}`} />
                      </div>

                      {/* Question Preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                            {question.necArticle}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {CATEGORIES.find((c) => c.slug === question.category)?.name}
                          </span>
                        </div>
                        <p
                          className={`text-foreground ${isExpanded ? "" : "line-clamp-2"}`}
                        >
                          {question.questionText}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpand(bookmark.id)}
                          className="h-8 w-8"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBookmark(bookmark.id)}
                          disabled={isRemoving}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded View */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border">
                            {/* Answer Options */}
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Answer Options:
                              </h4>
                              <div className="space-y-2">
                                {question.options.map((option, i) => (
                                  <div
                                    key={i}
                                    className={`flex items-start gap-2 p-2 rounded-lg ${
                                      i === question.correctAnswer
                                        ? "bg-emerald/10 border border-emerald/30 dark:bg-sparky-green/10 dark:border-sparky-green/30"
                                        : "bg-muted dark:bg-stone-800"
                                    }`}
                                  >
                                    <span
                                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                        i === question.correctAnswer
                                          ? "bg-emerald text-white dark:bg-sparky-green dark:text-stone-950"
                                          : "bg-background text-muted-foreground"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                    <span
                                      className={`text-sm ${
                                        i === question.correctAnswer
                                          ? "text-emerald font-medium"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {option}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Explanation */}
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Explanation:
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {question.explanation}
                              </p>
                              <p className="text-xs text-purple mt-2">
                                Reference: {question.necReference}
                              </p>
                            </div>

                            {/* Sparky Tip */}
                            <div className="bg-amber/10 rounded-lg p-3">
                              <h4 className="text-sm font-medium text-amber mb-1">
                                Sparky&apos;s Tip:
                              </h4>
                              <p className="text-sm text-foreground">
                                {question.sparkyTip}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty filtered state */}
      {filteredBookmarks.length === 0 && bookmarks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 text-center py-12"
        >
          <p className="text-muted-foreground">
            No bookmarks in this category. Try selecting a different filter.
          </p>
        </motion.div>
      )}

      {/* Sparky Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 mt-8"
      >
        <SparkyMessage
          size="medium"
          message="These bookmarked questions are gold! Review them regularly - they highlight exactly where you need to focus. Hit that 'Start Review Session' button to quiz yourself on just these questions!"
        />
      </motion.div>
    </main>
  );
}
