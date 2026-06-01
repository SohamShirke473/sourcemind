"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkspaceCardProps {
  id: string;
  title: string;
  lastModified: string;
  sourceCount: number;
  coverColor?: string;
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
        "group/card relative flex flex-col rounded-ui border border-border bg-card transition-all duration-150",
        "hover:border-primary hover:cursor-pointer",
      )}
    >
      <div
        className={cn("h-12 rounded-t-ui bg-linear-to-r", getCoverColor(id))}
      />
      <div className="flex flex-col gap-3 p-5">
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
          <button
            type="button"
            className="flex size-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Rename workspace"
            onClick={(e) => {
              e.preventDefault();
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
            }}
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
        <h3 className="font-mono text-base font-bold leading-snug text-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]"
          >
            {sourceCount} SOURCE{sourceCount !== 1 ? "S" : ""}
          </Badge>
          <span className="text-xs text-muted-foreground">{lastModified}</span>
        </div>
      </div>
    </a>
  );
}
