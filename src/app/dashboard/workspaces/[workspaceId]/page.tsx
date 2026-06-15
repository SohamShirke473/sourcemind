import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getQueryClient, trpc, prefetch, HydrateClient } from "@/trpc/server";

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;

  const queryClient = getQueryClient();
  const workspace = await queryClient.fetchQuery(
    trpc.workspace.getById.queryOptions({ id: workspaceId }),
  );

  if (!workspace) {
    notFound();
  }

  await Promise.all([
    prefetch(trpc.source.list.queryOptions({ workspaceId })),
    prefetch(trpc.chat.list.queryOptions({ workspaceId })),
    prefetch(trpc.artifact.list.queryOptions({ workspaceId })),
  ]);

  return (
    <HydrateClient>
      <WorkspaceShell workspace={workspace} />
    </HydrateClient>
  );
}
