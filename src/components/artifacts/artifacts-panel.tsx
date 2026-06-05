"use client";

import {
  BrainCircuitIcon,
  CircleHelpIcon,
  FileTextIcon,
  HeadphonesIcon,
  LayersIcon,
  PresentationIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

interface ArtifactTypeConfig {
  id: string;
  label: string;
  icon: typeof PresentationIcon;
}

const ARTIFACT_TYPES: ArtifactTypeConfig[] = [
  { id: "ppt", label: "PPT", icon: PresentationIcon },
  { id: "audio", label: "AUDIO", icon: HeadphonesIcon },
  { id: "mindmap", label: "MIND MAP", icon: BrainCircuitIcon },
  { id: "flashcard", label: "FLASHCARDS", icon: LayersIcon },
  { id: "quiz", label: "QUIZ", icon: CircleHelpIcon },
  { id: "report", label: "REPORT", icon: FileTextIcon },
];

interface ArtifactCardData {
  id: string;
  type: string;
  title: string;
  timestamp: string;
}

const MOCK_ARTIFACTS: ArtifactCardData[] = [
  {
    id: "1",
    type: "REPORT",
    title: "Document Overview Report",
    timestamp: "5 min ago",
  },
  {
    id: "2",
    type: "FLASHCARDS",
    title: "Key Concepts Flashcards",
    timestamp: "2 hours ago",
  },
];

import { ArtifactDetailModal } from "./artifact-detail-modal";

export function ArtifactsPanel() {
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] =
    useState<ArtifactCardData | null>(null);

  const handleGenerate = (typeId: string) => {
    setGeneratingType(typeId);
    setTimeout(() => setGeneratingType(null), 2000);
  };

  const handleCardClick = (artifact: ArtifactCardData) => {
    setSelectedArtifact(artifact);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-[0.05em] text-foreground">
          ARTIFACTS
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-border px-4 py-4">
        {ARTIFACT_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleGenerate(id)}
            disabled={generatingType !== null}
            className="flex flex-col items-center justify-center gap-2 rounded-ui border border-border bg-card px-4 py-5 transition-all hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingType === id ? (
              <Spinner className="size-6" />
            ) : (
              <Icon className="size-6 text-muted-foreground" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-foreground">
              {label}
            </span>
          </button>
        ))}
      </div>

      {MOCK_ARTIFACTS.length > 0 ? (
        <div className="flex flex-col gap-2 px-4 py-4">
          {MOCK_ARTIFACTS.map((artifact) => (
            <button
              key={artifact.id}
              type="button"
              onClick={() => handleCardClick(artifact)}
              className="flex flex-col gap-2 rounded-ui border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-primary">
                {artifact.type}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {artifact.title}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {artifact.timestamp}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <SparklesIcon className="size-8 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-[0.05em] text-foreground">
              NO ARTIFACTS YET
            </span>
            <span className="text-xs text-muted-foreground">
              Click an artifact type above to generate one
            </span>
          </div>
        </div>
      )}

      {selectedArtifact && (
        <ArtifactDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          type={selectedArtifact.type}
          title={selectedArtifact.title}
        />
      )}
    </div>
  );
}
