"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuitIcon,
  CircleHelpIcon,
  FileTextIcon,
  HeadphonesIcon,
  LayersIcon,
  PresentationIcon,
  SparklesIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { ArtifactDetailModal } from "./artifact-detail-modal";
import { GenerateArtifactDialog } from "./generate-artifact-dialog";

interface ArtifactTypeConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

const ARTIFACT_TYPES: ArtifactTypeConfig[] = [
  { id: "ppt", label: "PPT", icon: PresentationIcon },
  { id: "audio", label: "AUDIO", icon: HeadphonesIcon },
  { id: "mindmap", label: "MIND MAP", icon: BrainCircuitIcon },
  { id: "flashcard", label: "FLASHCARDS", icon: LayersIcon },
  { id: "quiz", label: "QUIZ", icon: CircleHelpIcon },
  { id: "report", label: "REPORT", icon: FileTextIcon },
];

const TYPE_LABEL_MAP: Record<string, string> = {
  ppt: "PPT",
  audio: "AUDIO",
  mindmap: "MIND MAP",
  flashcard: "FLASHCARDS",
  quiz: "QUIZ",
  report: "REPORT",
};

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

interface ArtifactsPanelProps {
  workspaceId: string;
}

export function ArtifactsPanel({ workspaceId }: ArtifactsPanelProps) {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateType, setGenerateType] = useState<string>("mindmap");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<{
    id: string;
    type: string;
    title: string;
    content?: Record<string, unknown> | null;
    status: string;
    createdAt: Date;
  } | null>(null);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const artifactsQuery = useQuery(
    trpc.artifact.list.queryOptions({ workspaceId }),
  );
  const artifacts = artifactsQuery.data ?? [];

  const isProcessing = artifacts.some((a) => a.status === "generating");

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries(
          trpc.artifact.list.queryFilter({ workspaceId }),
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isProcessing, queryClient, trpc, workspaceId]);

  const deleteArtifact = useMutation(
    trpc.artifact.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.artifact.list.queryFilter({ workspaceId }),
        );
        toast.success("Artifact deleted");
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to delete artifact");
      },
    }),
  );

  const handleGenerate = (typeId: string) => {
    setGenerateType(typeId);
    setGenerateOpen(true);
  };

  const handleCardClick = (artifact: (typeof artifacts)[number]) => {
    const content = artifact.content as Record<string, unknown> | null | undefined;
    setSelectedArtifact({
      id: artifact.id,
      type: TYPE_LABEL_MAP[artifact.type] ?? artifact.type,
      title: artifact.title,
      content,
      status: artifact.status,
      createdAt: artifact.createdAt,
    });
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
            className="flex flex-col items-center justify-center gap-2 rounded-ui border border-border bg-card px-4 py-5 transition-all hover:border-primary hover:bg-muted"
          >
            <Icon className="size-6 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-foreground">
              {label}
            </span>
          </button>
        ))}
      </div>

      {artifacts.length > 0 ? (
        <div className="flex flex-col gap-2 px-4 py-4">
          {artifacts.map((artifact) => (
            <div key={artifact.id} className="group relative">
              <button
                type="button"
                onClick={() => handleCardClick(artifact)}
                className="flex w-full flex-col gap-2 rounded-ui border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-primary">
                    {TYPE_LABEL_MAP[artifact.type] ?? artifact.type}
                  </span>
                  {artifact.status === "generating" && (
                    <Spinner className="size-3" />
                  )}
                  {artifact.status === "failed" && (
                    <span className="text-[10px] font-bold uppercase text-red-500">
                      Failed
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {artifact.title}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {artifact.status === "generating"
                    ? "Generating..."
                    : timeAgo(artifact.createdAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteArtifact.mutate({ id: artifact.id })}
                className="absolute right-2 top-2 hidden rounded-ui p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-hover:block"
                aria-label="Delete artifact"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
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

      <GenerateArtifactDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        artifactType={generateType}
        workspaceId={workspaceId}
      />

      {selectedArtifact && (
        <ArtifactDetailModal
          id={selectedArtifact.id}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          type={selectedArtifact.type}
          title={selectedArtifact.title}
          content={selectedArtifact.content}
          status={selectedArtifact.status}
        />
      )}
    </div>
  );
}
