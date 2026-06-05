"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArtifactsPanel } from "@/components/artifacts/artifacts-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { SourcesPanel } from "@/components/sources/sources-panel";
import { UploadModal } from "@/components/upload/upload-modal";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { useTRPC } from "@/trpc/client";

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
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const chatsQuery = useQuery(
    trpc.chat.list.queryOptions({ workspaceId: workspace.id }),
  );

  const createChat = useMutation(
    trpc.chat.create.mutationOptions({
      onSuccess: (chat) => {
        setSelectedChatId(chat.id);
        queryClient.invalidateQueries(
          trpc.chat.list.queryFilter({ workspaceId: workspace.id }),
        );
      },
    }),
  );

  useEffect(() => {
    const chats = chatsQuery.data;
    if (chats && chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].id);
    } else if (chats && chats.length === 0 && !createChat.isPending) {
      createChat.mutate({ workspaceId: workspace.id });
    }
  }, [chatsQuery.data, selectedChatId, createChat, workspace.id]);

  const handleTitleChange = (title: string) => {
    if (selectedChatId) {
      queryClient.setQueryData(
        trpc.chat.list.queryKey({ workspaceId: workspace.id }),
        // biome-ignore lint/suspicious/noExplicitAny: selective field update
        (old: any) =>
          old?.map((c: { id: string }) =>
            c.id === selectedChatId ? { ...c, title } : c,
          ),
      );
    }
  };

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
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
        chat={
          selectedChatId ? (
            <ChatPanel
              workspaceId={workspace.id}
              chatId={selectedChatId}
              onTitleChange={handleTitleChange}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Creating chat...
            </div>
          )
        }
        artifacts={<ArtifactsPanel workspaceId={workspace.id} />}
      />
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        workspaceId={workspace.id}
      />
    </div>
  );
}
