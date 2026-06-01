import { WorkspaceShell } from "@/components/workspace/workspace-shell";

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  await params;

  return <WorkspaceShell />;
}
