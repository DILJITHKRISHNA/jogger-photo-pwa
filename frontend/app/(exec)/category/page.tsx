"use client";

import Link from "next/link";
import { Images } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/features/catalogue/use-categories";

export default function CategoryIndexPage() {
  const { categories, loading } = useCategories();

  return (
    <>
      <AppHeader title="Bulk Photos" backHref="/" />
      <div className="px-4 py-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Pick a category to view and share every photo in it.
        </p>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.97]"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Images className="size-5" />
                </span>
                <p className="text-[15px] font-bold leading-tight">{category.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
