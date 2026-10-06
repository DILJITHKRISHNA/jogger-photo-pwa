"use client";

import Link from "next/link";
import { Images, Ruler } from "lucide-react";

import { cn } from "@/lib/utils";
import { ALL_SIZES_SLUG, type SizeGroup } from "@/features/catalogue/use-gallery";

const ACCENTS = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
} as const;

/** The size boxes inside a category (6x10, 7x10, …), plus "All sizes" first. */
export function SizeGrid({
  baseHref,
  groups,
  totalCount,
  accent = "primary",
}: {
  baseHref: string;
  groups: SizeGroup[];
  totalCount: number;
  accent?: keyof typeof ACCENTS;
}) {
  const tiles = [
    { slug: ALL_SIZES_SLUG, label: "All sizes", count: totalCount, all: true },
    ...groups.map((g) => ({ ...g, all: false })),
  ];

  return (
    <div className="px-4 py-4">
      <p className="mb-3 text-xs text-muted-foreground">Pick a size to view and share its photos.</p>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <Link
            key={tile.slug}
            href={`${baseHref}/${encodeURIComponent(tile.slug)}`}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.97]"
          >
            <span className={cn("flex size-10 items-center justify-center rounded-xl", ACCENTS[accent])}>
              {tile.all ? <Images className="size-5" /> : <Ruler className="size-5" />}
            </span>
            <div>
              <p className="text-[15px] font-bold leading-tight">{tile.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tile.count} photo{tile.count === 1 ? "" : "s"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
