"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CodeIcon,
  FileIcon,
  FileTextIcon,
  GlobeIcon,
  ImageIcon,
  PlayIcon,
  PlusIcon,
  TextIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const typeIcons: Record<string, typeof FileTextIcon> = {
  pdf: FileTextIcon,
  url: GlobeIcon,
  youtube: PlayIcon,
  text: TextIcon,
  document: FileIcon,
  code: CodeIcon,
  image: ImageIcon,
  audio: PlayIcon,
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
  workspaceId: string;
}

export function SourcesPanel({
  onUploadClick,
  workspaceId,
}: SourcesPanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  const { data: sources = [] } = useQuery({
    ...trpc.source.list.queryOptions({ workspaceId }),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.length === 0) return false;
      return data.some((s) => s.status === "processing") ? 3000 : false;
    },
  });

  const deleteSource = useMutation(
    trpc.source.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.source.list.queryFilter({ workspaceId }),
        );
        toast.success("Source deleted");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

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
          className="flex size-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Add source"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-1 px-2 py-2">
          {sources.length === 0 && (
            <p className="px-2 py-4 text-center text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
              No sources yet
            </p>
          )}
          {sources.map((source) => {
            const Icon = typeIcons[source.type] || FileTextIcon;
            const status = statusConfig[source.status];
            return (
              <div
                key={source.id}
                className="group flex items-center gap-3 rounded-ui px-2 py-2.5 transition-colors hover:bg-muted/50"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm text-foreground">
                  {source.title}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em]",
                    status.className,
                  )}
                >
                  {status.label}
                </Badge>
                <button
                  type="button"
                  onClick={() => deleteSource.mutate({ id: source.id })}
                  className="flex size-6 shrink-0 items-center justify-center text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete source"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
