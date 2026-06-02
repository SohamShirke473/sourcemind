import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getQueryClient, trpc } from "@/trpc/server";

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

  return <WorkspaceShell workspace={workspace} />;
}
