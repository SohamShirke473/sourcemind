"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface WorkspaceHeaderProps {
  title: string;
}

export function WorkspaceHeader({ title }: WorkspaceHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  return (
    <header className="flex items-center gap-4 border-b border-border bg-card px-6 py-3">
      <Link
        href="/"
        className="flex size-8 items-center justify-center text-foreground hover:bg-muted"
        aria-label="Back to dashboard"
      >
        <ArrowLeftIcon className="size-4" />
      </Link>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditing(false);
          }}
          className="h-8 border border-border bg-transparent px-2 font-mono text-base font-bold text-foreground outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "h-8 px-2 font-mono text-base font-bold text-foreground",
            "hover:bg-muted",
          )}
        >
          {value}
        </button>
      )}
    </header>
  );
}
