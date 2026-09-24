"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroups, type GroupKind } from "@/features/catalogue/use-groups";

/** Grid of Brand or Gender boxes — mirrors the Bulk Photos category picker. */
export function GroupIndex({
  kind,
  title,
  hint,
  emptyText,
  hrefBase,
  icon: Icon,
}: {
  kind: GroupKind;
  title: string;
  hint: string;
  emptyText: string;
  hrefBase: string;
  icon: LucideIcon;
}) {
  const { groups, loading } = useGroups(kind);

  return (
    <>
      <AppHeader title={title} backHref="/" />
      <div className="px-4 py-4">
        <p className="mb-3 text-xs text-muted-foreground">{hint}</p>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`${hrefBase}/${group.slug}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.97]"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-[15px] font-bold leading-tight">{group.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {group.count} photo{group.count === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
