"use client";

import { LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { CreateWorkspaceDialog } from "@/components/dashboard/create-workspace-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PillButton } from "@/components/ui/pill-button";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <nav className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
        <Link
          href="/"
          className="text-lg font-bold uppercase tracking-[0.05em] text-foreground"
        >
          SourceMind
        </Link>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            <SunIcon className="hidden size-4 dark:block" />
            <MoonIcon className="block size-4 dark:hidden" />
          </Button>
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="outline-none cursor-pointer"
                aria-label="User menu"
              >
                <Avatar size="default">
                  <AvatarFallback>
                    {(session.user.name ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuItem onSelect={() => authClient.signOut()}>
                  <LogOutIcon className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
          )}
          <PillButton
            variant="primary"
            size="default"
            onClick={() => setCreateOpen(true)}
          >
            NEW WORKSPACE
          </PillButton>
        </div>
      </nav>
      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
