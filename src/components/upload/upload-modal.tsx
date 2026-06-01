"use client";

import { CloudUploadIcon, Link2Icon, PlayIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PillButton } from "@/components/ui/pill-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[480px] gap-0 p-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
          <DialogTitle className="font-mono text-sm font-bold uppercase tracking-[0.05em]">
            ADD SOURCES
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        </DialogHeader>
        <div className="px-6 py-5">
          <Tabs defaultValue="files" className="w-full">
            <TabsList
              variant="line"
              className="mb-6 w-full justify-start gap-6"
            >
              <TabsTrigger
                value="files"
                className="font-mono text-xs font-bold uppercase tracking-[0.05em] data-active:text-primary data-active:after:bg-primary"
              >
                FILES
              </TabsTrigger>
              <TabsTrigger
                value="url"
                className="font-mono text-xs font-bold uppercase tracking-[0.05em] data-active:text-primary data-active:after:bg-primary"
              >
                URL
              </TabsTrigger>
              <TabsTrigger
                value="youtube"
                className="font-mono text-xs font-bold uppercase tracking-[0.05em] data-active:text-primary data-active:after:bg-primary"
              >
                YOUTUBE
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="mt-0">
              <div className="flex flex-col items-center gap-4">
                <div
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-3 rounded-ui border-2 border-dashed border-border bg-muted/20 px-6 py-12",
                    "transition-colors hover:border-primary/50",
                  )}
                >
                  <CloudUploadIcon className="size-8 text-muted-foreground" />
                  <p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
                    Drag & drop files here
                  </p>
                  <PillButton variant="ghost" size="sm" type="button">
                    BROWSE FILES
                  </PillButton>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Accepted formats: PDF, TXT, DOCX, Markdown
                </p>
              </div>
            </TabsContent>

            <TabsContent value="url" className="mt-0">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Link2Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="https://example.com/article"
                    className="h-10 w-full rounded-ui border border-border bg-card pl-9 text-sm"
                  />
                </div>
                <PillButton
                  variant="primary"
                  size="default"
                  className="self-end"
                >
                  ADD URL
                </PillButton>
              </div>
            </TabsContent>

            <TabsContent value="youtube" className="mt-0">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <PlayIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-10 w-full rounded-ui border border-border bg-card pl-9 text-sm"
                  />
                </div>
                <PillButton
                  variant="primary"
                  size="default"
                  className="self-end"
                >
                  ADD VIDEO
                </PillButton>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
