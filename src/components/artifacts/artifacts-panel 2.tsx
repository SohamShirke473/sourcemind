"use client";

import { useState } from "react";
import { SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PillButton } from "@/components/ui/pill-button";
import { Spinner } from "@/components/ui/spinner";

const ARTIFACT_TYPES = ["SUMMARY", "MIND MAP", "QUIZ", "FLASHCARDS", "TIMELINE"] as const;

interface ArtifactCardData {
  id: string;
  type: string;
  title: string;
  timestamp: string;
}

const MOCK_ARTIFACTS: ArtifactCardData[] = [
  { id: "1", type: "SUMMARY", title: "Document Overview Summary", timestamp: "5 min ago" },
  { id: "2", type: "FLASHCARDS", title: "Key Concepts Flashcards", timestamp: "2 hours ago" },
];

import { ArtifactDetailModal } from "./artifact-detail-modal";

export function ArtifactsPanel() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactCardData | null>(null);

  const handleGenerate = () => {
    if (!activeType) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  const handleCardClick = (artifact: ArtifactCardData) => {
    setSelectedArtifact(artifact);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-[0.05em] text-foreground">
          ARTIFACTS
        </span>
        <PillButton
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={!activeType || generating}
        >
          {generating ? (
            <>
              <Spinner className="size-3" />
              GENERATING...
            </>
          ) : (
            "GENERATE"
          )}
        </PillButton>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3">
        {ARTIFACT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.05em] transition-all",
              activeType === type
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-white text-foreground hover:bg-muted",
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {MOCK_ARTIFACTS.length > 0 ? (
        <div className="flex flex-col gap-2 px-4 py-4">
          {MOCK_ARTIFACTS.map((artifact) => (
            <div
              key={artifact.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-white px-4 py-3 transition-colors hover:border-primary"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-secondary">
                {artifact.type}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {artifact.title}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {artifact.timestamp}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <SparklesIcon className="size-8 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-[0.05em] text-foreground">
              GENERATE YOUR FIRST ARTIFACT
            </span>
            <span className="text-xs text-muted-foreground">
              Select an artifact type and click generate
            </span>
          </div>
          <PillButton variant="primary" size="sm">
            GET STARTED
          </PillButton>
        </div>
      )}
    </div>
  );
}
