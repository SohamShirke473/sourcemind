import { Navbar } from "@/components/dashboard/navbar";
import { SearchInput } from "@/components/dashboard/search-input";
import { WorkspaceGrid } from "@/components/dashboard/workspace-grid";

export default function DashboardPage() {
  return (
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-mono text-lg font-bold uppercase tracking-[0.05em] text-foreground">
              YOUR WORKSPACES
            </h1>
            <span className="text-xs text-muted-foreground">4 WORKSPACES</span>
          </div>
          <SearchInput />
        </div>
        <WorkspaceGrid />
      </main>
    </div>
  );
}
