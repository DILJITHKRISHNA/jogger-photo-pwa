import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ExecutiveMenu } from "@/components/executive/executive-menu";
import type { ExecutiveSession } from "@/lib/auth/executive";

export function AppHeader({
  title,
  backHref,
  session,
}: {
  title: string;
  backHref?: string;
  session: ExecutiveSession;
}) {
  return (
    <header className="safe-top sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-3">
        {backHref ? (
          <Link
            href={backHref}
            className="-ml-1 flex size-9 items-center justify-center rounded-full text-foreground/80 hover:bg-muted"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
            J
          </span>
        )}
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight">
          {title}
        </h1>
        <ExecutiveMenu name={session.name} employeeId={session.employeeId} />
      </div>
    </header>
  );
}
