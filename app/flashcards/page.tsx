"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  Bookmark,
  Loader2,
  Star,
  Brain,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import {
  FLASHCARD_SETS,
  FLASHCARDS,
  type Flashcard,
  type FlashcardSet,
} from "@/app/flashcards/flashcards";

export default function FlashcardsPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    }>
      <FlashcardsContent />
    </Suspense>
  );
}

function FlashcardsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [savedCardsLoaded, setSavedCardsLoaded] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const navigatingToCardRef = useRef<number | null>(null);
  const initialSetChosen = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load saved cards from database on mount
  useEffect(() => {
    async function loadSavedCards() {
      try {
        const response = await fetch("/api/flashcard-bookmarks");
        if (response.ok) {
          const data = await response.json();
          const savedIds = new Set<string>(
            data.bookmarks.map((b: { flashcardId: string }) => b.flashcardId)
          );
          setSavedCards(savedIds);
        }
      } catch (error) {
        console.error("Failed to load saved flashcards:", error);
      } finally {
        setSavedCardsLoaded(true);
      }
    }
    if (status === "authenticated") {
      loadSavedCards();
    }
  }, [status]);

  // Set initial set after saved cards are loaded
  useEffect(() => {
    if (savedCardsLoaded && !initialSetChosen.current) {
      initialSetChosen.current = true;
      // Default to "saved" if there are saved cards, otherwise first set
      if (savedCards.size > 0) {
        setSelectedSetId("saved");
      } else {
        setSelectedSetId(FLASHCARD_SETS[0]?.id ?? "all");
      }
    }
  }, [savedCardsLoaded, savedCards]);

  // Handle query parameter for direct card navigation
  useEffect(() => {
    const cardParam = searchParams.get("card");
    if (cardParam && savedCardsLoaded) {
      // Find which set contains this card
      const targetSet = FLASHCARD_SETS.find((set) =>
        set.cards.some((c) => c.id === cardParam)
      );

      if (targetSet) {
        const cardIndex = targetSet.cards.findIndex((c) => c.id === cardParam);
        if (cardIndex !== -1) {
          // Set the ref so the set change effect doesn't reset the index
          navigatingToCardRef.current = cardIndex;
          setSelectedSetId(targetSet.id);
          setIsFlipped(false);
        }
      } else {
        // Check if it's in all cards
        const allCardsIndex = FLASHCARDS.findIndex((c) => c.id === cardParam);
        if (allCardsIndex !== -1) {
          navigatingToCardRef.current = allCardsIndex;
          setSelectedSetId("all");
          setIsFlipped(false);
        }
      }
      // Clear the query param after navigation
      router.replace("/flashcards", { scroll: false });
    }
  }, [searchParams, savedCardsLoaded, router]);

  useEffect(() => {
    if (selectedSetId === null) return; // Wait for initial set selection

    if (selectedSetId === "saved") {
      // Filter to only show saved cards
      const savedCardsList = FLASHCARDS.filter((card) => savedCards.has(card.id));
      setCards(savedCardsList);
    } else {
      const activeSet: FlashcardSet | undefined = FLASHCARD_SETS.find(
        (set) => set.id === selectedSetId
      );
      setCards(activeSet ? activeSet.cards : FLASHCARDS);
    }

    // Check if we're navigating to a specific card via query param
    if (navigatingToCardRef.current !== null) {
      setCurrentIndex(navigatingToCardRef.current);
      navigatingToCardRef.current = null;
    } else {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  }, [selectedSetId, savedCards]);

  if (status === "loading" || selectedSetId === null) {
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
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
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
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleToggleSave = async () => {
    if (!currentCard) return;

    const isCurrentlySaved = savedCards.has(currentCard.id);

    // Optimistically update UI
    setSavedCards((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlySaved) {
        newSet.delete(currentCard.id);
      } else {
        newSet.add(currentCard.id);
      }
      return newSet;
    });

    // Persist to database
    try {
      if (isCurrentlySaved) {
        await fetch("/api/flashcard-bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flashcardId: currentCard.id }),
        });
      } else {
        await fetch("/api/flashcard-bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flashcardId: currentCard.id }),
        });
      }
    } catch (error) {
      // Revert on error
      console.error("Failed to toggle flashcard bookmark:", error);
      setSavedCards((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlySaved) {
          newSet.add(currentCard.id);
        } else {
          newSet.delete(currentCard.id);
        }
        return newSet;
      });
    }
  };

  const handleReset = async () => {
    // Clear all saved flashcards from database
    const savedArray = Array.from(savedCards);

    // Optimistically clear UI
    setSavedCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);

    // Delete each bookmark from database
    try {
      await Promise.all(
        savedArray.map((id) =>
          fetch("/api/flashcard-bookmarks", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ flashcardId: id }),
          })
        )
      );
    } catch (error) {
      console.error("Failed to clear saved flashcards:", error);
      // Revert on error
      setSavedCards(new Set(savedArray));
    }
  };

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
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
          <span className="text-emerald dark:text-sparky-green">Flashcards</span>
        </h1>
        <p className="text-muted-foreground">
          Master key NEC concepts with our flashcard system. Flip to reveal answers!
        </p>
      </motion.div>

      {/* Set Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {/* Saved Cards Filter - only show if there are saved cards */}
        {savedCards.size > 0 && (
          <Button
            variant={selectedSetId === "saved" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSetId("saved")}
            className={selectedSetId === "saved" ? "bg-amber hover:bg-amber/90" : "border-amber text-amber hover:bg-amber/10"}
          >
            <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
            Saved ({savedCards.size})
          </Button>
        )}
        {FLASHCARD_SETS.map((set) => (
          <Button
            key={set.id}
            variant={selectedSetId === set.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSetId(set.id)}
            className={selectedSetId === set.id ? "bg-emerald hover:bg-emerald/90 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950" : ""}
          >
            {set.name}
          </Button>
        ))}
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5 text-amber" />
            {savedCards.size} saved
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

      {/* Flashcard */}
      {cards.length > 0 && currentCard ? (
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
                              {currentCard.category}
                            </span>
                            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted dark:bg-stone-800">
                              {FLASHCARD_SETS.find((s) => s.cards.some((c) => c.id === currentCard.id))?.name || "All"}
                            </span>
                          </div>
                          {savedCards.has(currentCard.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber hover:text-amber/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSave();
                              }}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </Button>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <Brain className="h-10 w-10 text-emerald dark:text-sparky-green mb-4" />
                          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                            {currentCard.front}
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
                          {savedCards.has(currentCard.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber hover:text-amber/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSave();
                              }}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </Button>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed mb-4">
                            {currentCard.back}
                          </p>
                          <div className="flex items-center gap-1.5 text-emerald dark:text-sparky-green">
                            <BookOpen className="h-4 w-4" />
                            <p className="text-sm font-medium">
                              {currentCard.necReference}
                            </p>
                          </div>
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
      ) : (
        <Card className="min-h-[400px] flex items-center justify-center mb-6 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <div className="text-center">
            {selectedSetId === "saved" ? (
              <>
                <Star className="h-12 w-12 text-amber/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No saved flashcards yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click the bookmark button on any card to save it for later.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No flashcards available for this category.</p>
            )}
          </div>
        </Card>
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
          variant={currentCard && savedCards.has(currentCard.id) ? "default" : "outline"}
          className={currentCard && savedCards.has(currentCard.id) ? "bg-amber hover:bg-amber/90 text-white" : "border-amber text-amber hover:bg-amber/10"}
          onClick={handleToggleSave}
          disabled={!currentCard}
        >
          <Bookmark className={`h-4 w-4 mr-1 ${currentCard && savedCards.has(currentCard.id) ? "fill-white" : ""}`} />
          {currentCard && savedCards.has(currentCard.id) ? "Saved" : "Save for Later"}
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="border-border dark:border-stone-700"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-center gap-3 mb-8"
      >
        <Button variant="outline" onClick={handleShuffle} className="border-border dark:border-stone-700">
          <Shuffle className="h-4 w-4 mr-2" />
          Shuffle
        </Button>
        <Button variant="outline" onClick={handleReset} className="border-border dark:border-stone-700">
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear Saved
        </Button>
      </motion.div>

      {/* Sparky Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <SparkyMessage
          size="medium"
          message="Flashcards are great for memorizing NEC references and key values! Try to recall the answer before flipping. Spaced repetition is your friend - come back daily for best results!"
        />
      </motion.div>

      {/* Saved Cards List */}
      {savedCards.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber fill-amber dark:text-sparky-green dark:fill-sparky-green" />
            Saved for Later ({savedCards.size})
          </h2>
          <div className="grid gap-2">
            {FLASHCARDS.filter((card) => savedCards.has(card.id)).map((card) => {
              const setName = FLASHCARD_SETS.find((s) =>
                s.cards.some((c) => c.id === card.id)
              )?.name;
              return (
                <Link
                  key={card.id}
                  href={`/flashcards?card=${card.id}`}
                  className="block"
                >
                  <Card className="p-3 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 hover:border-amber/50 hover:bg-amber/5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/30 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.08)] cursor-pointer group pressable">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-amber dark:group-hover:text-sparky-green transition-colors">
                          {card.front}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {setName} • {card.necReference}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-amber dark:group-hover:text-sparky-green group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
      </div>
    </main>
  );
}
