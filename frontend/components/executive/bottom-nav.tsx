"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Images, PackageCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/search") },
  {
    href: "/category",
    label: "Bulk Photos",
    icon: Images,
    match: (p: string) => p.startsWith("/category"),
  },
  {
    href: "/stock",
    label: "Today's Stock",
    icon: PackageCheck,
    match: (p: string) => p.startsWith("/stock"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl transition-colors",
                  active && "bg-primary/12"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
