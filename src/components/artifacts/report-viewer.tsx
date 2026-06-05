"use client";

import { CopyIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ReportViewerProps {
  report: string;
}

export function ReportViewer({ report }: ReportViewerProps) {
  if (!report) {
    return (
      <p className="px-6 py-6 text-sm text-muted-foreground">
        No report content available.
      </p>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    toast.success("Report copied to clipboard");
  };

  return (
    <div className="relative flex flex-col px-6 py-6 max-h-[60vh] overflow-y-auto">
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleCopy}
        >
          <CopyIcon className="size-4" />
          Copy
        </Button>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
      </div>
    </div>
  );
}
