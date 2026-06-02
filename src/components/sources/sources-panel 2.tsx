"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  GlobeIcon,
  PlayIcon,
  PlusIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SourceItem {
  id: string;
  type: "pdf" | "url" | "youtube";
  title: string;
  status: "processing" | "ready" | "failed";
}

const MOCK_SOURCES: SourceItem[] = [
  { id: "1", type: "pdf", title: "react-docs-v19.pdf", status: "ready" },
  {
    id: "2",
    type: "url",
    title: "https://example.com/article",
    status: "ready",
  },
  {
    id: "3",
    type: "youtube",
    title: "Understanding LLMs",
    status: "processing",
  },
];

const typeIcons = {
  pdf: FileTextIcon,
  url: GlobeIcon,
  youtube: PlayIcon,
};

const statusConfig = {
  processing: {
    label: "PROCESSING",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  ready: {
    label: "READY",
    className: "bg-success/10 text-success border-success/20",
  },
  failed: {
    label: "ERROR",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

interface SourcesPanelProps {
  onUploadClick: () => void;
}

export function SourcesPanel({ onUploadClick }: SourcesPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.05em] text-foreground"
        >
          {collapsed ? (
            <ChevronRightIcon className="size-3.5" />
          ) : (
            <ChevronDownIcon className="size-3.5" />
          )}
          SOURCES
        </button>
        <button
          type="button"
          onClick={onUploadClick}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Add source"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-1 px-2 py-2">
          {MOCK_SOURCES.map((source) => {
            const Icon = typeIcons[source.type];
            const status = statusConfig[source.status];
            return (
              <div
                key={source.id}
                className="flex items-center gap-3 rounded-[4px] px-2 py-2.5 transition-colors hover:bg-muted/50"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm text-foreground">
                  {source.title}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 rounded-[4px] border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em]",
                    status.className,
                  )}
                >
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
