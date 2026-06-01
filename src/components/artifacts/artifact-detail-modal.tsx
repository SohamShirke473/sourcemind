"use client";

import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ArtifactDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: string;
  title: string;
}

export function ArtifactDetailModal({
  open,
  onOpenChange,
  type,
  title,
}: ArtifactDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[720px] gap-0 p-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-ui bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-primary">
              {type}
            </span>
            <DialogTitle className="font-mono text-sm font-bold text-foreground">
              {title}
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-6 py-6">
          <p className="text-sm leading-relaxed text-foreground">
            Artifact content will appear here once generated. This is a detailed
            view of the {type.toLowerCase()} artifact named &ldquo;{title}
            &rdquo;.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
