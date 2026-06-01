"use client";

import { PillButton } from "@/components/ui/pill-button";

const SUGGESTED_PROMPTS = [
  "Summarize my sources in 5 bullet points",
  "What are the key differences between these documents?",
  "Create a timeline of events mentioned",
];

export function ChatEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="font-mono text-lg font-extrabold text-foreground">
          WHAT WOULD YOU LIKE TO KNOW?
        </h2>
        <p className="text-sm text-muted-foreground">
          Add sources to get started
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <PillButton
            key={prompt}
            variant="ghost"
            size="sm"
            className="rounded-ui border border-secondary/30 text-xs text-secondary hover:bg-muted"
          >
            {prompt}
          </PillButton>
        ))}
      </div>
    </div>
  );
}
