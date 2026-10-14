"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { ExecutiveMenu } from "@/components/executive/executive-menu";
import { cameFrom } from "@/lib/client/nav-history";

/**
 * `backHref` is this page's parent — the back arrow always goes one level up
 * (breadcrumb-style), never sideways to an unrelated page.
 */
export function AppHeader({ title, backHref }: { title: string; backHref?: string }) {
  const router = useRouter();

  function handleBack(event: React.MouseEvent<HTMLAnchorElement>) {
    // Parent is the page we just came from → step back so it keeps its scroll
    // position; otherwise the link opens the parent.
    if (!backHref || !cameFrom(backHref)) return;
    event.preventDefault();
    router.back();
  }

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-3">
        {backHref ? (
          <Link
            href={backHref}
            onClick={handleBack}
            className="-ml-1 flex size-9 items-center justify-center rounded-full text-foreground/80 hover:bg-muted"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : (
          <BrandMark className="size-9 rounded-xl" />
        )}
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight">{title}</h1>
        <ExecutiveMenu />
      </div>
    </header>
  );
}
