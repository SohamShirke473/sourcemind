"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizViewerProps {
  questions: QuizQuestion[];
}

function MarkdownInline({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ p: ({ children }) => <>{children}</> }}
    >
      {children}
    </ReactMarkdown>
  );
}

export function QuizViewer({ questions }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(questions.length).fill(null),
  );
  const [finished, setFinished] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const total = questions.length;
  const current = questions[currentIndex];
  const isLast = currentIndex === total - 1;
  const answered = answers[currentIndex] !== null;
  const selectedAnswer = answers[currentIndex];
  const score = useMemo(
    () => answers.reduce<number>((s, a, i) => s + (a === questions[i]?.correctIndex ? 1 : 0), 0),
    [answers, questions],
  );
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const goNext = useCallback(() => {
    if (isLast) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isLast]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (finished) return;
      if (e.key === "ArrowRight" && answers[currentIndex] !== null) goNext();
      if (e.key === "ArrowLeft" && currentIndex > 0) goPrev();
      if (e.key >= "1" && e.key <= "4" && answers[currentIndex] === null) {
        const idx = parseInt(e.key) - 1;
        if (idx < (current?.options.length ?? 0)) {
          setAnswers((prev) => {
            const next = [...prev];
            next[currentIndex] = idx;
            return next;
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finished, answers, currentIndex, current?.options.length, goNext, goPrev]);

  const handleSelect = (idx: number) => {
    if (answers[currentIndex] !== null) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = idx;
      return next;
    });
  };

  const getOptionClass = (idx: number) => {
    if (answers[currentIndex] === null) {
      return "border-border hover:border-primary hover:bg-muted cursor-pointer";
    }
    if (idx === current.correctIndex) {
      return "border-green-500 bg-green-500/10 cursor-default";
    }
    if (idx === selectedAnswer && idx !== current.correctIndex) {
      return "border-red-500 bg-red-500/10 cursor-default";
    }
    return "border-border opacity-50 cursor-default";
  };

  const progressValue = total > 0
    ? ((currentIndex + (answers[currentIndex] !== null ? 1 : 0)) / total) * 100
    : 0;

  if (!questions || questions.length === 0) {
    return (
      <p className="px-6 py-6 text-sm text-muted-foreground">
        No quiz questions available.
      </p>
    );
  }

  if (finished && !showReview) {
    let grade: string;
    if (percentage >= 90) grade = "Excellent!";
    else if (percentage >= 70) grade = "Good job!";
    else if (percentage >= 50) grade = "Not bad";
    else grade = "Keep studying";

    return (
      <div className="flex flex-col items-center gap-6 px-6 py-10">
        <span className="text-4xl font-bold text-foreground">
          {score}/{total}
        </span>
        <span className="text-lg font-semibold text-muted-foreground">
          {grade}
        </span>
        <Progress value={percentage} className="h-2 w-full max-w-[300px]" />
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReview(true)}
          >
            Review Answers
          </Button>
        </div>
      </div>
    );
  }

  if (finished && showReview) {
    return (
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-6 py-6">
        <span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">
          Review ({score}/{total})
        </span>
        {questions.map((q, qi) => {
          const userAns = answers[qi];
          const correct = userAns === q.correctIndex;
          return (
            <div key={qi} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center">
                  {correct ? (
                    <CheckIcon className="size-4 text-green-500" />
                  ) : (
                    <XIcon className="size-4 text-red-500" />
                  )}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
                  Q{qi + 1}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert mb-3 max-w-none text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question}</ReactMarkdown>
              </div>
              <div className="flex flex-col gap-1.5">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={cn(
                      "flex items-center gap-2 rounded-ui border px-3 py-2 text-sm",
                      oi === q.correctIndex
                        ? "border-green-500 bg-green-500/10"
                        : oi === userAns && oi !== q.correctIndex
                          ? "border-red-500 bg-red-500/10"
                          : "border-border",
                    )}
                  >
                    <span className="text-xs text-muted-foreground">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="text-foreground">
                      <MarkdownInline>{opt}</MarkdownInline>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
          Question {currentIndex + 1} / {total}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
          {score} / {total}
        </span>
      </div>

      <Progress value={progressValue} className="h-1.5" />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.question}</ReactMarkdown>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {current.options.map((opt, oi) => (
          <button
            key={oi}
            type="button"
            onClick={() => handleSelect(oi)}
            disabled={answered}
            className={cn(
              "flex items-center gap-3 rounded-ui border px-4 py-3 text-left text-sm transition-all",
              getOptionClass(oi),
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
              {answered && oi === current.correctIndex ? (
                <CheckIcon className="size-3.5 text-green-500" />
              ) : answered && oi === selectedAnswer ? (
                <XIcon className="size-3.5 text-red-500" />
              ) : (
                String.fromCharCode(65 + oi)
              )}
            </span>
            <span className="text-sm text-foreground">
              <MarkdownInline>{opt}</MarkdownInline>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {answered && current.explanation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-ui border border-border bg-muted/50 px-4 py-3"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
              Explanation
            </span>
            <div className="prose prose-sm dark:prose-invert mt-1 max-w-none text-muted-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {current.explanation}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {answered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end"
        >
          <Button variant="default" size="sm" onClick={goNext}>
            {isLast ? "Finish" : "Next"} &rarr;
          </Button>
        </motion.div>
      )}
    </div>
  );
}
