"use client";

import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AudioViewer = dynamic(() => import("./audio-viewer").then((mod) => mod.AudioViewer), {
  loading: () => <div className="p-6 text-sm text-muted-foreground animate-pulse">Loading audio...</div>,
  ssr: false,
});
const FlashcardViewer = dynamic(() => import("./flashcard-viewer").then((mod) => mod.FlashcardViewer), {
  loading: () => <div className="p-6 text-sm text-muted-foreground animate-pulse">Loading flashcards...</div>,
  ssr: false,
});
const MindmapViewer = dynamic(() => import("./mindmap-viewer").then((mod) => mod.MindmapViewer), {
  loading: () => <div className="p-6 text-sm text-muted-foreground animate-pulse">Loading mindmap...</div>,
  ssr: false,
});
const QuizViewer = dynamic(() => import("./quiz-viewer").then((mod) => mod.QuizViewer), {
  loading: () => <div className="p-6 text-sm text-muted-foreground animate-pulse">Loading quiz...</div>,
  ssr: false,
});
const ReportViewer = dynamic(() => import("./report-viewer").then((mod) => mod.ReportViewer), {
  loading: () => <div className="p-6 text-sm text-muted-foreground animate-pulse">Loading report...</div>,
  ssr: false,
});

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
  const [imageError, setImageError] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset error state whenever the displayed artifact changes or modal opens
  useEffect(() => {
    setImageError(false);
  }, [id, open]);

  const isMindMap = type === "MIND MAP" || type === "mindmap";
  const isFlashcard = type === "FLASHCARDS" || type === "flashcard";
  const isQuiz = type === "QUIZ" || type === "quiz";
  const isReport = type === "REPORT" || type === "report";
  const isAudio = type === "AUDIO" || type === "audio";
  const isInfographic = type === "INFOGRAPHIC" || type === "infographic";

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

    if (isInfographic) {
      return (
        <div className="flex h-full flex-col items-center justify-between p-6 gap-6 bg-card">
          <div className="flex-1 flex items-center justify-center overflow-auto w-full max-h-[50vh] min-h-[300px] border border-border rounded-ui bg-muted/20 relative group">
            {imageError ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                <p className="text-sm font-medium text-destructive">
                  Failed to load infographic image.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageError(false)}
                >
                  Retry Loading
                </Button>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              // biome-ignore lint/performance/noImgElement: standard img tag is necessary because the src references a dynamic backend API route directly
              <img
                src={`/api/artifacts/${id}/image`}
                alt={title}
                onError={() => setImageError(true)}
                className="max-h-[48vh] max-w-full object-contain rounded-ui shadow-sm transition-transform duration-300 hover:scale-105"
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                window.location.href = `/api/artifacts/${id}/image?download=true`;
              }}
            >
              Download Infographic
            </Button>
          </div>
        </div>
      );
    }

    if (isAudio) {
      return <AudioViewer artifactId={id} />;
    }

    if (isMindMap && content?.nodes && content?.edges) {
      return (
        <MindmapViewer
          nodes={
            content.nodes as {
              id: string;
              label: string;
              parentId: string | null;
            }[]
          }
          edges={
            content.edges as { from: string; to: string; label?: string }[]
          }
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
          questions={
            content.questions as {
              question: string;
              options: string[];
              correctIndex: number;
              explanation?: string;
            }[]
          }
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
