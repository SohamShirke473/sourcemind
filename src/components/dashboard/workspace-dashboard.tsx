"use client";

import { useState } from "react";
import { SearchInput } from "./search-input";
import { WorkspaceGrid } from "./workspace-grid";

export function WorkspaceDashboard() {
  const [search, setSearch] = useState("");

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-mono text-lg font-bold uppercase tracking-[0.05em] text-foreground">
            YOUR WORKSPACES
          </h1>
        </div>
        <SearchInput value={search} onChange={setSearch} />
      </div>
      <WorkspaceGrid search={search} />
    </>
  );
}
