"use client";

import { SendHorizonalIcon } from "lucide-react";
import { PillButton } from "@/components/ui/pill-button";

export function ChatInput() {
  return (
    <div className="sticky bottom-0 border-t border-border bg-card p-4">
      <div className="flex items-center gap-3 rounded-ui border border-border bg-card px-4 py-3">
        <input
          placeholder="Ask anything about your sources..."
          className="h-auto flex-1 border-none bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground focus:outline-none"
        />
        <PillButton
          variant="primary"
          size="icon"
          type="submit"
          aria-label="Send message"
        >
          <SendHorizonalIcon className="size-4" />
        </PillButton>
      </div>
    </div>
  );
}
