"use client";

import type { ReactNode } from "react";

interface WorkspaceLayoutProps {
  sources: ReactNode;
  chat: ReactNode;
  artifacts: ReactNode;
}

export function WorkspaceLayout({
  sources,
  chat,
  artifacts,
}: WorkspaceLayoutProps) {
  return (
    <div
      className="flex flex-1 overflow-hidden"
      style={{ height: "calc(100vh - 57px)" }}
    >
      <div className="w-[25%] min-w-0 border-r border-border bg-white">
        <div className="h-full overflow-y-auto">{sources}</div>
      </div>
      <div className="flex w-[45%] min-w-0 flex-col bg-background">
        <div className="flex flex-1 flex-col overflow-hidden">{chat}</div>
      </div>
      <div className="w-[30%] min-w-0 border-l border-border bg-white">
        <div className="h-full overflow-y-auto">{artifacts}</div>
      </div>
    </div>
  );
}
