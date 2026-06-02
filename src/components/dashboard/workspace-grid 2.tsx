"use client";

import { Grid3X3Icon, ListIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { WorkspaceCard } from "./workspace-card";

interface Workspace {
  id: string;
  title: string;
  lastModified: string;
  sourceCount: number;
}

const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "1",
    title: "React Documentation Analysis",
    lastModified: "2 hours ago",
    sourceCount: 4,
  },
  {
    id: "2",
    title: "Q4 Financial Reports",
    lastModified: "Yesterday",
    sourceCount: 8,
  },
  {
    id: "3",
    title: "Machine Learning Research Papers",
    lastModified: "3 days ago",
    sourceCount: 12,
  },
  {
    id: "4",
    title: "Product Requirements Notes",
    lastModified: "1 week ago",
    sourceCount: 2,
  },
];

type ViewMode = "grid" | "table";

export function WorkspaceGrid() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
          {MOCK_WORKSPACES.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              id={workspace.id}
              title={workspace.title}
              lastModified={workspace.lastModified}
              sourceCount={workspace.sourceCount}
            />
          ))}
        </div>
      ) : (
        <div className="border border-border">
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
              {MOCK_WORKSPACES.map((workspace) => (
                <tr
                  key={workspace.id}
                  className="border-b border-border transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/workspace/${workspace.id}`}
                      className="font-mono text-sm font-bold text-foreground hover:text-primary"
                    >
                      {workspace.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {workspace.sourceCount}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {workspace.lastModified}
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
    </div>
  );
}
