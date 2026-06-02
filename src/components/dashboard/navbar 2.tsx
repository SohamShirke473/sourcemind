"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { PillButton } from "@/components/ui/pill-button";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-border bg-white px-8 py-4">
      <Link
        href="/"
        className="text-lg font-bold uppercase tracking-[0.05em] text-foreground"
      >
        SourceMind
      </Link>
      <div className="flex items-center gap-4">
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
