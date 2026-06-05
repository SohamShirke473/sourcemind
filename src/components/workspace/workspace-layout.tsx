"use client";

import type { ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

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
      <Group
        orientation="horizontal"
        id="workspace-panels"
        defaultLayout={{ sources: 25, chat: 45, artifacts: 30 }}
      >
        <Panel id="sources" defaultSize="25%" minSize="15%" maxSize="40%">
          <div className="h-full overflow-y-auto border-r border-border bg-card">
            {sources}
          </div>
        </Panel>
        <Separator className="w-px bg-border transition-colors hover:bg-primary data-dragging:bg-primary" />
        <Panel id="chat" defaultSize="45%" minSize="30%">
          <div className="flex h-full flex-col overflow-hidden bg-background">{chat}</div>
        </Panel>
        <Separator className="w-px bg-border transition-colors hover:bg-primary data-dragging:bg-primary" />
        <Panel id="artifacts" defaultSize="30%" minSize="20%" maxSize="45%">
          <div className="h-full overflow-y-auto border-l border-border bg-card">
            {artifacts}
          </div>
        </Panel>
      </Group>
    </div>
  );
}
