"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
}

export function FlashcardViewer({ cards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = cards.length;
  const currentCard = cards[currentIndex];

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    }
  }, [currentIndex, total]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext]);

  if (!cards || cards.length === 0) {
    return (
      <p className="px-6 py-6 text-sm text-muted-foreground">
        No flashcards available.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-6">
      <span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">
        {currentIndex + 1} / {total}
      </span>

      <div
        className="h-[280px] w-full max-w-[500px] cursor-pointer"
        style={{ perspective: 1000 }}
        onClick={() => setFlipped((f) => !f)}
      >
        <motion.div
          className="relative size-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-border bg-card p-6"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-center text-sm font-semibold text-foreground">
              {currentCard.front}
            </p>
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-border bg-card p-6"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-center text-sm text-foreground">
              {currentCard.back}
            </p>
          </div>
        </motion.div>
      </div>

      <span className="text-[10px] text-muted-foreground">Click to flip</span>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          disabled={currentIndex === 0}
          className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          disabled={currentIndex === total - 1}
          className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
