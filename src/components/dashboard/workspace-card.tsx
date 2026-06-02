"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

interface WorkspaceCardProps {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  sourceCount: number;
  lastModified: string;
}

const COVER_COLORS = [
  "from-primary/30 to-primary/10",
  "from-chart-2/30 to-chart-2/10",
  "from-chart-3/30 to-chart-3/10",
  "from-chart-4/30 to-chart-4/10",
  "from-chart-5/30 to-chart-5/10",
];

function getCoverColor(id: string) {
  const index = Number.parseInt(id, 10) || id.charCodeAt(0);
  return COVER_COLORS[index % COVER_COLORS.length];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

export function WorkspaceCard({
  id,
  title,
  description,
  emoji,
  sourceCount,
  lastModified,
}: WorkspaceCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateWorkspace = useMutation(
    trpc.workspace.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.workspace.list.queryFilter());
        toast.success("Workspace renamed");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const deleteWorkspace = useMutation(
    trpc.workspace.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.workspace.list.queryFilter());
        toast.success("Workspace deleted");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const handleRename = () => {
    if (renameValue.trim() && renameValue.trim() !== title) {
      updateWorkspace.mutate({ id, title: renameValue.trim() });
    }
    setRenaming(false);
  };

  return (
    <>
      <a
        href={`/workspace/${id}`}
        className={cn(
          "group/card relative flex flex-col rounded-ui border border-border bg-card transition-all duration-150",
          "hover:border-primary hover:cursor-pointer",
        )}
      >
        <div
          className={cn(
            "flex h-12 items-center justify-center rounded-t-ui bg-linear-to-r text-2xl",
            getCoverColor(id),
          )}
        >
          {emoji && <span>{emoji}</span>}
        </div>
        <div className="flex flex-col gap-3 p-5">
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
            <button
              type="button"
              className="flex size-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Rename workspace"
              onClick={(e) => {
                e.preventDefault();
                setRenameValue(title);
                setRenaming(true);
              }}
            >
              <PencilIcon className="size-3.5" />
            </button>
            <button
              type="button"
              className="flex size-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive"
              aria-label="Delete workspace"
              onClick={(e) => {
                e.preventDefault();
                setDeleteOpen(true);
              }}
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>

          {renaming ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setRenameValue(title);
                  setRenaming(false);
                }
              }}
              className="h-8 text-base font-bold"
              onClick={(e) => e.preventDefault()}
              autoFocus
            />
          ) : (
            <h3 className="font-mono text-base font-bold leading-snug text-foreground">
              {title}
            </h3>
          )}

          {description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]"
            >
              {sourceCount} SOURCE{sourceCount !== 1 ? "S" : ""}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(new Date(lastModified))}
            </span>
          </div>
        </div>
      </a>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{title}" and all its sources, chats,
              and artifacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteWorkspace.mutate({ id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
