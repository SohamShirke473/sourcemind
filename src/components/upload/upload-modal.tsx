"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ClipboardIcon,
  CloudUploadIcon,
  FileIcon,
  GlobeIcon,
  Link2Icon,
  Loader2Icon,
  PlayIcon,
  TextIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTRPC, useTRPCClient } from "@/trpc/client";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

type ViewState = "hub" | "websites" | "youtube" | "text";

export function UploadModal({
  open,
  onOpenChange,
  workspaceId,
}: UploadModalProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const [view, setView] = useState<ViewState>("hub");
  const [urlValue, setUrlValue] = useState("");
  const [youtubeValue, setYoutubeValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSource = useMutation(
    trpc.source.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.source.list.queryFilter({ workspaceId }),
        );
      },
    }),
  );

  function handleClose() {
    setUrlValue("");
    setYoutubeValue("");
    setTextValue("");
    setSelectedFile(null);
    setUploading(false);
    setView("hub");
    setIsDragging(false);
    onOpenChange(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  async function handleFileUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const { uploadUrl, key } = await trpcClient.source.getUploadUrl.mutate({
        workspaceId,
        fileName: selectedFile.name,
        contentType: selectedFile.type || "application/octet-stream",
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) throw new Error("Upload to storage failed");

      await trpcClient.source.confirmUpload.mutate({
        workspaceId,
        key,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      });

      queryClient.invalidateQueries(
        trpc.source.list.queryFilter({ workspaceId }),
      );
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      handleClose();
    }
  }

  async function handleUrlSubmit() {
    const urls = urlValue
      .split(/[\s\n]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) {
      toast.error("Please paste at least one website link");
      return;
    }

    setUploading(true);
    try {
      for (const url of urls) {
        // Add protocol if missing for display/extraction purposes
        const targetUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        const title =
          targetUrl
            .replace(/^https?:\/\//i, "")
            .replace(/\/.*$/, "")
            .slice(0, 100) || targetUrl.slice(0, 100);

        await createSource.mutateAsync({
          workspaceId,
          type: "url",
          title,
          sourceUrl: targetUrl,
        });
      }

      toast.success(
        urls.length === 1 ? "URL added" : `${urls.length} URLs added`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add URL");
    } finally {
      setUploading(false);
      handleClose();
    }
  }

  async function handleYoutubeSubmit() {
    const urls = youtubeValue
      .split(/[\s\n]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) {
      toast.error("Please paste at least one YouTube link");
      return;
    }

    setUploading(true);
    try {
      for (const url of urls) {
        const targetUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        const title = targetUrl.slice(0, 100);

        await createSource.mutateAsync({
          workspaceId,
          type: "youtube",
          title,
          sourceUrl: targetUrl,
        });
      }

      toast.success(
        urls.length === 1
          ? "YouTube video added"
          : `${urls.length} videos added`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add video");
    } finally {
      setUploading(false);
      handleClose();
    }
  }

  async function handleTextSubmit() {
    if (!textValue.trim()) {
      toast.error("Please write or paste some text");
      return;
    }

    setUploading(true);
    try {
      const title = textValue.trim().split("\n")[0].slice(0, 100) || "Untitled";

      await createSource.mutateAsync({
        workspaceId,
        type: "text",
        title,
        rawContent: textValue.trim(),
      });

      toast.success("Text added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add text");
    } finally {
      setUploading(false);
      handleClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[640px] sm:max-w-[640px] gap-0 p-8"
        showCloseButton={false}
      >
        {view === "hub" && (
          <>
            <DialogTitle className="sr-only">add sources</DialogTitle>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <XIcon className="size-4" />
            </button>

            <div className="flex flex-col gap-6 mt-2">
              {/* Drag & Drop Area */}
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/10 px-6 py-16 transition-all duration-200",
                  isDragging && "border-primary bg-primary/5 scale-[0.99]",
                  selectedFile && "border-primary/50 bg-primary/5",
                  !selectedFile && "hover:border-primary/45 hover:bg-muted/15",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  accept=".pdf,.docx,.pptx,.xlsx,.odt,.odp,.ods,.rtf,.csv,.md,.txt,.html,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.c,.cpp,.h,.css,.scss,.json,.yaml,.yml,.xml,.sh,.sql,.rb,.php,.swift,.kt,.png,.jpg,.jpeg,.gif,.webp,.svg"
                />

                {!selectedFile ? (
                  <>
                    <CloudUploadIcon className="size-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-lg font-medium text-foreground tracking-tight lowercase">
                        or drop your files
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground lowercase">
                        pdf, images, docs, audio,{" "}
                        <span className="underline">and more</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                    <FileIcon className="size-12 text-primary animate-pulse" />
                    <div className="text-center w-full">
                      <p className="text-sm font-medium text-foreground truncate px-4">
                        {selectedFile.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 w-full justify-center">
                      <PillButton
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="text-xs h-8 px-4 text-muted-foreground hover:text-destructive lowercase"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                        }}
                      >
                        remove
                      </PillButton>
                      <PillButton
                        variant="primary"
                        size="sm"
                        type="button"
                        className="text-xs h-8 px-4 lowercase"
                        disabled={uploading}
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileUpload();
                        }}
                      >
                        {uploading ? (
                          <>
                            <Loader2Icon className="size-3.5 animate-spin mr-1" />
                            uploading
                          </>
                        ) : (
                          "upload"
                        )}
                      </PillButton>
                    </div>
                  </div>
                )}
              </label>

              {/* Action Row */}
              {!selectedFile && (
                <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm lowercase"
                  >
                    <CloudUploadIcon className="size-4 text-muted-foreground" />
                    upload files
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("websites")}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm lowercase"
                  >
                    <GlobeIcon className="size-4 text-muted-foreground" />
                    websites
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("youtube")}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm lowercase"
                  >
                    <PlayIcon className="size-4 text-red-500 fill-red-500" />
                    youtube
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("text")}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm lowercase"
                  >
                    <ClipboardIcon className="size-4 text-muted-foreground" />
                    copied text
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {view === "websites" && (
          <>
            <DialogTitle className="sr-only">website urls</DialogTitle>

            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setView("hub")}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Back"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
                <h2 className="text-base font-semibold text-foreground lowercase">
                  website urls
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed lowercase">
                paste website urls below to upload as a source in sourcemind.
              </p>

              <div className="relative">
                <Link2Icon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                <Textarea
                  placeholder="paste any links (one per line)..."
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  className="min-h-[160px] w-full rounded-lg border border-border bg-card/50 pl-9 pt-3 text-xs lowercase"
                />
              </div>

              <ul className="list-disc pl-4 flex flex-col gap-1.5 mt-2">
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  to add multiple urls, separate with a space or new line.
                </li>
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  only the visible text on the website will be imported at this
                  time.
                </li>
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  paid articles are not supported.
                </li>
              </ul>

              <div className="flex justify-end mt-4">
                <PillButton
                  variant="primary"
                  size="sm"
                  className="px-6 h-8 lowercase text-xs"
                  disabled={!urlValue.trim() || uploading}
                  onClick={handleUrlSubmit}
                >
                  {uploading ? (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin mr-1" />
                      inserting
                    </>
                  ) : (
                    "insert"
                  )}
                </PillButton>
              </div>
            </div>
          </>
        )}

        {view === "youtube" && (
          <>
            <DialogTitle className="sr-only">youtube urls</DialogTitle>

            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setView("hub")}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Back"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
                <h2 className="text-base font-semibold text-foreground lowercase">
                  youtube urls
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed lowercase">
                paste youtube urls below to upload transcripts as a source in
                sourcemind.
              </p>

              <div className="relative">
                <PlayIcon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                <Textarea
                  placeholder="paste any links (one per line)..."
                  value={youtubeValue}
                  onChange={(e) => setYoutubeValue(e.target.value)}
                  className="min-h-[160px] w-full rounded-lg border border-border bg-card/50 pl-9 pt-3 text-xs"
                />
              </div>

              <ul className="list-disc pl-4 flex flex-col gap-1.5 mt-2">
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  to add multiple urls, separate with a space or new line.
                </li>
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  only the text transcript in youtube will be imported at this
                  time.
                </li>
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  only public youtube videos are supported.
                </li>
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  recently uploaded videos may not be available to import.
                </li>
              </ul>

              <div className="flex justify-end mt-4">
                <PillButton
                  variant="primary"
                  size="sm"
                  className="px-6 h-8 lowercase text-xs"
                  disabled={!youtubeValue.trim() || uploading}
                  onClick={handleYoutubeSubmit}
                >
                  {uploading ? (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin mr-1" />
                      inserting
                    </>
                  ) : (
                    "insert"
                  )}
                </PillButton>
              </div>
            </div>
          </>
        )}

        {view === "text" && (
          <>
            <DialogTitle className="sr-only">copied text</DialogTitle>

            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setView("hub")}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Back"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
                <h2 className="text-base font-semibold text-foreground lowercase">
                  copied text
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed lowercase">
                paste or write your markdown or plain text below to save as a
                source in sourcemind.
              </p>

              <div className="relative">
                <TextIcon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                <Textarea
                  placeholder="paste or write your text here..."
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  className="min-h-[220px] max-h-[45vh] w-full overflow-y-auto rounded-lg border border-border bg-card/50 pl-9 pt-3 text-xs"
                />
              </div>

              <ul className="list-disc pl-4 flex flex-col gap-1.5 mt-2">
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  the first line of your text will be used as the source title.
                </li>
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  markdown formatting is fully supported.
                </li>
                <li className="text-[11px] text-muted-foreground leading-normal lowercase">
                  content is indexed instantly for semantic search and queries.
                </li>
              </ul>

              <div className="flex justify-end mt-4">
                <PillButton
                  variant="primary"
                  size="sm"
                  className="px-6 h-8 lowercase text-xs"
                  disabled={!textValue.trim() || uploading}
                  onClick={handleTextSubmit}
                >
                  {uploading ? (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin mr-1" />
                      inserting
                    </>
                  ) : (
                    "insert"
                  )}
                </PillButton>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
