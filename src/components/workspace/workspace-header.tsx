"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

interface Workspace {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
}

interface WorkspaceHeaderProps {
  workspace: Workspace;
}

export function WorkspaceHeader({ workspace }: WorkspaceHeaderProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(workspace.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(workspace.title);
  }, [workspace.title]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const updateWorkspace = useMutation(
    trpc.workspace.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.workspace.getById.queryFilter({ id: workspace.id }),
        );
        toast.success("Workspace renamed");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const handleSubmit = () => {
    if (value.trim() && value.trim() !== workspace.title) {
      updateWorkspace.mutate({ id: workspace.id, title: value.trim() });
    } else {
      setValue(workspace.title);
    }
    setEditing(false);
  };

  return (
    <header className="flex items-center gap-4 border-b border-border bg-card px-6 py-3">
      <Link
        href="/"
        className="flex size-8 items-center justify-center text-foreground hover:bg-muted"
        aria-label="Back to dashboard"
      >
        <ArrowLeftIcon className="size-4" />
      </Link>
      {workspace.emoji && <span className="text-lg">{workspace.emoji}</span>}
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") {
              setValue(workspace.title);
              setEditing(false);
            }
          }}
          className="h-8 border border-border bg-transparent px-2 font-mono text-base font-bold text-foreground outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "h-8 px-2 font-mono text-base font-bold text-foreground",
            "hover:bg-muted",
          )}
        >
          {value}
        </button>
      )}
    </header>
  );
}
