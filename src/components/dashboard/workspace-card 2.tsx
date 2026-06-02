"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkspaceCardProps {
  id: string;
  title: string;
  lastModified: string;
  sourceCount: number;
}

export function WorkspaceCard({
  id,
  title,
  lastModified,
  sourceCount,
}: WorkspaceCardProps) {
  return (
    <a
      href={`/workspace/${id}`}
      className={cn(
        "group/card relative flex flex-col gap-3 rounded-lg border border-border bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-150",
        "hover:border-primary hover:cursor-pointer",
      )}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Rename workspace"
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          <PencilIcon className="size-3.5" />
        </button>
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
          aria-label="Delete workspace"
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </div>
      <h3 className="font-mono text-lg font-bold leading-snug text-foreground">
        {title}
      </h3>
      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          className="rounded-[4px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]"
        >
          {sourceCount} SOURCE{sourceCount !== 1 ? "S" : ""}
        </Badge>
        <span className="text-xs text-muted-foreground">{lastModified}</span>
      </div>
    </a>
  );
}
