"use client";

import Link from "next/link";
import { Images } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/features/catalogue/use-categories";
import {
  stockCategoriesFromItems,
  useStockGallery,
} from "@/features/catalogue/use-gallery";

function formatUpdated(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StockPage() {
  const { items, stockDate, loading: stockLoading } = useStockGallery();
  const { categories, loading: categoriesLoading } = useCategories();
  const updated = formatUpdated(stockDate);
  const loading = stockLoading || categoriesLoading;
  const stockCategories = stockCategoriesFromItems(items, categories);

  return (
    <>
      <AppHeader title="Today's Stock" backHref="/" />
      {updated && (
        <p className="border-b border-border bg-muted/50 px-4 py-2 text-center text-[11px] font-medium text-muted-foreground">
          Stock list updated {updated}
        </p>
      )}
      <div className="px-4 py-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Pick a category to view and share today&apos;s stock photos.
        </p>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No stock uploaded yet. Ask your admin to upload today&apos;s stock Excel.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stockCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/stock/${category.slug}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.97]"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Images className="size-5" />
                </span>
                <div>
                  <p className="text-[15px] font-bold leading-tight">{category.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {category.count} photo{category.count === 1 ? "" : "s"}
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
