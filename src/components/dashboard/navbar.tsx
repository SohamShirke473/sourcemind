"use client";

import { UserButton } from "@clerk/nextjs";
import { MoonIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { PillButton } from "@/components/ui/pill-button";

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
      <Link
        href="/"
        className="text-lg font-bold uppercase tracking-[0.05em] text-foreground"
      >
        SourceMind
      </Link>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Toggle dark mode"
        >
          <SunIcon className="size-4 hidden dark:block" />
          <MoonIcon className="size-4 block dark:hidden" />
        </button>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-8 rounded-full",
            },
          }}
        />
        <PillButton variant="primary" size="default">
          NEW WORKSPACE
        </PillButton>
      </div>
    </nav>
  );
}
