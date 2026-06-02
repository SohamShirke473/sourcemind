"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PillButton } from "@/components/ui/pill-button";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";

const EMOJIS = [
  "📄",
  "📊",
  "📝",
  "📚",
  "🎓",
  "💡",
  "⚡",
  "🚀",
  "🎯",
  "🧠",
  "🔬",
  "📈",
  "💼",
  "🎨",
  "🛠️",
  "📁",
];

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("");

  const createWorkspace = useMutation(
    trpc.workspace.create.mutationOptions({
      onSuccess: (workspace) => {
        toast.success("Workspace created");
        onOpenChange(false);
        queryClient.invalidateQueries(trpc.workspace.list.queryFilter());
        router.push(`/dashboard/workspaces/${workspace.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createWorkspace.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      emoji: emoji || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[480px] sm:max-w-[480px] gap-0 p-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
          <DialogTitle className="font-mono text-sm font-bold uppercase tracking-[0.05em]">
            NEW WORKSPACE
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <span className="text-sm">✕</span>
          </Button>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
              Title
            </label>
            <Input
              placeholder="e.g. Q4 Financial Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
              Description (optional)
            </label>
            <Textarea
              placeholder="What is this workspace about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
              Emoji (optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(emoji === e ? "" : e)}
                  className={`flex size-8 items-center justify-center rounded-ui border text-sm transition-colors ${
                    emoji === e
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <PillButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              CANCEL
            </PillButton>
            <PillButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={!title.trim() || createWorkspace.isPending}
            >
              {createWorkspace.isPending ? "CREATING..." : "CREATE"}
            </PillButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
