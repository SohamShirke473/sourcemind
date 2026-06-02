"use client";

import { useState } from "react";
import { ArtifactsPanel } from "@/components/artifacts/artifacts-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { SourcesPanel } from "@/components/sources/sources-panel";
import { UploadModal } from "@/components/upload/upload-modal";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

export function WorkspaceShell() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <WorkspaceHeader title="Untitled Workspace" />
      <WorkspaceLayout
        sources={<SourcesPanel onUploadClick={() => setUploadOpen(true)} />}
        chat={<ChatPanel />}
        artifacts={<ArtifactsPanel />}
      />
      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
