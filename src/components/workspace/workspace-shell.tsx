"use client";

import { useState } from "react";
import { ArtifactsPanel } from "@/components/artifacts/artifacts-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { SourcesPanel } from "@/components/sources/sources-panel";
import { UploadModal } from "@/components/upload/upload-modal";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

interface Workspace {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
}

interface WorkspaceShellProps {
  workspace: Workspace;
}

export function WorkspaceShell({ workspace }: WorkspaceShellProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--border) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceLayout
        sources={
          <SourcesPanel
            onUploadClick={() => setUploadOpen(true)}
            workspaceId={workspace.id}
          />
        }
        chat={<ChatPanel />}
        artifacts={<ArtifactsPanel />}
      />
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        workspaceId={workspace.id}
      />
    </div>
  );
}
