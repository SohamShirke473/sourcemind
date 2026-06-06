"use client";

import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--border) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="flex w-full max-w-md flex-col items-center rounded-ui border border-border bg-card p-8 shadow-sm backdrop-blur-[4px]">
        <div className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertCircleIcon className="size-8" />
        </div>

        <h1 className="mb-2 font-mono text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>

        <p className="mb-6 max-w-sm font-mono text-sm text-muted-foreground">
          An unexpected error occurred. Please try reloading the page or contact
          support if the issue persists.
        </p>

        {error.message && (
          <div className="mb-6 w-full rounded-ui bg-muted/50 p-3 text-left">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Error Details:
            </span>
            <code className="font-mono text-[11px] text-destructive break-all block">
              {error.message}
            </code>
          </div>
        )}

        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            variant="default"
            className="flex-1 font-mono text-sm gap-2"
            onClick={() => reset()}
          >
            <RotateCcwIcon className="size-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            className="flex-1 font-mono text-sm"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
