"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Grid3X3Icon, ListIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
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
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { WorkspaceCard } from "./workspace-card";

type ViewMode = "grid" | "table";

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

interface WorkspaceGridProps {
  search?: string;
}

export function WorkspaceGrid({ search }: WorkspaceGridProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: workspaces, isLoading } = useQuery(
    trpc.workspace.list.queryOptions({ search: search || undefined }),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const deleteWorkspace = useMutation(
    trpc.workspace.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.workspace.list.queryFilter());
        toast.success("Workspace deleted");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!workspaces?.length) {
    return <DashboardEmptyState />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setViewMode("grid")}
          className={cn(
            "flex size-7 items-center justify-center text-xs transition-colors",
            viewMode === "grid"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-label="Grid view"
        >
          <Grid3X3Icon className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("table")}
          className={cn(
            "flex size-7 items-center justify-center text-xs transition-colors",
            viewMode === "table"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-label="Table view"
        >
          <ListIcon className="size-3.5" />
        </button>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              id={workspace.id}
              title={workspace.title}
              description={workspace.description}
              emoji={workspace.emoji}
              sourceCount={workspace.sourceCount}
              lastModified={workspace.updatedAt.toISOString()}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-ui border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
                  Sources
                </th>
                <th className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
                  Last Modified
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {workspaces.map((workspace) => (
                <tr
                  key={workspace.id}
                  className="border-b border-border transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/workspace/${workspace.id}`}
                      className="flex items-center gap-2 font-mono text-sm font-bold text-foreground hover:text-primary"
                    >
                      {workspace.emoji && <span>{workspace.emoji}</span>}
                      {workspace.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {workspace.sourceCount}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatRelativeTime(workspace.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Rename"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            id: workspace.id,
                            title: workspace.title,
                          })
                        }
                        className="flex size-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}" and all its
              sources, chats, and artifacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  deleteWorkspace.mutate({ id: deleteTarget.id });
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
