"use client";

import { FileTextIcon } from "lucide-react";
import { PillButton } from "@/components/ui/pill-button";

export function DashboardEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-24">
      <div className="flex size-16 items-center justify-center rounded-ui bg-muted/30">
        <FileTextIcon className="size-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-foreground">
          NO WORKSPACES YET
        </h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Create a workspace to start chatting with your sources
        </p>
      </div>
      <PillButton variant="primary" size="default">
        CREATE YOUR FIRST WORKSPACE
      </PillButton>
    </div>
  );
}
