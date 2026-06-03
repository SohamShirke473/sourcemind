import { Navbar } from "@/components/dashboard/navbar";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function DashboardPage() {
  await prefetch(trpc.workspace.list.queryOptions({ search: undefined }));

  return (
    <HydrateClient>
      <div
        className="flex min-h-screen flex-col"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <Navbar />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-6">
          <WorkspaceDashboard />
        </main>
      </div>
    </HydrateClient>
  );
}
