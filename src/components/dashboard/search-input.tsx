"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SEARCH WORKSPACES..."
        className="h-9 w-72 rounded-ui border border-border bg-card pl-9 text-xs font-medium uppercase tracking-[0.05em] placeholder:text-muted-foreground"
      />
    </div>
  );
}
