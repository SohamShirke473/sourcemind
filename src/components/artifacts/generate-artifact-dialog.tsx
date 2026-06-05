"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuitIcon,
  CircleHelpIcon,
  FileTextIcon,
  HeadphonesIcon,
  LayersIcon,
  PresentationIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const TYPE_META: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  ppt: { label: "PPT", icon: PresentationIcon, color: "text-orange-500" },
  audio: { label: "AUDIO", icon: HeadphonesIcon, color: "text-blue-500" },
  mindmap: {
    label: "MIND MAP",
    icon: BrainCircuitIcon,
    color: "text-purple-500",
  },
  flashcard: {
    label: "FLASHCARDS",
    icon: LayersIcon,
    color: "text-green-500",
  },
  quiz: { label: "QUIZ", icon: CircleHelpIcon, color: "text-yellow-500" },
  report: {
    label: "REPORT",
    icon: FileTextIcon,
    color: "text-red-500",
  },
};

interface GenerateArtifactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifactType: string;
  workspaceId: string;
}

export function GenerateArtifactDialog({
  open,
  onOpenChange,
  artifactType,
  workspaceId,
}: GenerateArtifactDialogProps) {
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(
    new Set(),
  );
  const [prompt, setPrompt] = useState("");
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const meta = TYPE_META[artifactType] ?? TYPE_META.mindmap;
  const Icon = meta.icon;

  const sourcesQuery = useQuery(trpc.source.list.queryOptions({ workspaceId }));
  const readySources = (sourcesQuery.data ?? []).filter(
    (s) => s.status === "ready",
  );

  const createArtifact = useMutation(
    trpc.artifact.generate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.artifact.list.queryFilter({ workspaceId }),
        );
        onOpenChange(false);
        toast.success(`${meta.label} generation started`);
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to generate artifact");
      },
    }),
  );

  const handleSubmit = () => {
    if (selectedSourceIds.size === 0) {
      toast.error("Select at least one source");
      return;
    }
    createArtifact.mutate({
      workspaceId,
      type: artifactType as
        | "ppt"
        | "audio"
        | "mindmap"
        | "flashcard"
        | "quiz"
        | "report",
      title: `New ${meta.label}`,
      sourceIds: Array.from(selectedSourceIds),
      prompt: prompt || undefined,
    });
  };

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isGenerating = createArtifact.status === "pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[540px] sm:max-w-[540px] gap-0 p-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Icon className={cn("size-5", meta.color)} />
            <DialogTitle className="text-sm font-bold text-foreground">
              Generate {meta.label}
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

        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
              Select Sources
            </span>
            {sourcesQuery.isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner className="size-4" />
              </div>
            ) : readySources.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No ready sources found. Upload a source first.
              </p>
            ) : (
              <div className="flex max-h-[160px] flex-col gap-1 overflow-y-auto">
                {readySources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => toggleSource(source.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-ui border px-3 py-2 text-left text-xs transition-colors",
                      selectedSourceIds.has(source.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                        selectedSourceIds.has(source.id)
                          ? "border-primary bg-primary"
                          : "border-border",
                      )}
                    >
                      {selectedSourceIds.has(source.id) && (
                        <span className="text-[10px] font-bold text-primary-foreground">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="truncate font-medium text-foreground">
                      {source.title}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] uppercase text-muted-foreground">
                      {source.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
              Custom Prompt (optional)
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Customize how the artifact should be generated..."
              rows={3}
              className="w-full resize-none rounded-ui border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={isGenerating || selectedSourceIds.size === 0}
          >
            {isGenerating ? (
              <>
                <Spinner className="size-3" />
                GENERATING...
              </>
            ) : (
              "GENERATE"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
