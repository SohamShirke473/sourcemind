"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlashcardViewer } from "./flashcard-viewer";
import { MindmapViewer } from "./mindmap-viewer";
import { QuizViewer } from "./quiz-viewer";
import { ReportViewer } from "./report-viewer";

import { AudioViewer } from "./audio-viewer";

interface ArtifactDetailModalProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: string;
  title: string;
  content?: Record<string, unknown> | null;
  status: string;
}

export function ArtifactDetailModal({
  id,
  open,
  onOpenChange,
  type,
  title,
  content,
  status,
}: ArtifactDetailModalProps) {
  const isMindMap = type === "MIND MAP" || type === "mindmap";
  const isFlashcard = type === "FLASHCARDS" || type === "flashcard";
  const isQuiz = type === "QUIZ" || type === "quiz";
  const isReport = type === "REPORT" || type === "report";
  const isAudio = type === "AUDIO" || type === "audio";

  const renderContent = () => {
    if (status === "generating") {
      return (
        <p className="text-sm text-muted-foreground">
          This artifact is still being generated. Check back shortly.
        </p>
      );
    }

    if (status === "failed") {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm font-medium text-destructive">
            Generation failed. Please try again.
          </p>
        </div>
      );
    }

    if (isAudio) {
      return <AudioViewer artifactId={id} />;
    }

    if (isMindMap && content?.nodes && content?.edges) {
      return (
        <MindmapViewer
          nodes={content.nodes as { id: string; label: string; parentId: string | null }[]}
          edges={content.edges as { from: string; to: string; label?: string }[]}
        />
      );
    }

    if (isFlashcard && content?.cards) {
      return (
        <FlashcardViewer
          cards={content.cards as { front: string; back: string }[]}
        />
      );
    }

    if (isQuiz && content?.questions) {
      return (
        <QuizViewer
          questions={content.questions as { question: string; options: string[]; correctIndex: number; explanation?: string }[]}
        />
      );
    }

    if (isReport && content?.report) {
      return <ReportViewer report={content.report as string} />;
    }

    return (
      <p className="text-sm leading-relaxed text-foreground">
        Artifact content will appear here once generated. This is a detailed
        view of the {type.toLowerCase()} artifact named &ldquo;{title}&rdquo;.
      </p>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          isMindMap
            ? "max-w-[90vw] sm:max-w-[90vw] gap-0 overflow-hidden p-0"
            : "max-w-[720px] sm:max-w-[720px] gap-0 p-0"
        }
        showCloseButton={false}
        style={isMindMap ? { height: "80vh" } : undefined}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-ui bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-primary">
              {type}
            </span>
            <DialogTitle className="font-mono text-sm font-bold text-foreground">
              {title}
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </Button>
        </DialogHeader>
        <div style={isMindMap ? { height: "calc(80vh - 57px)" } : undefined}>
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
