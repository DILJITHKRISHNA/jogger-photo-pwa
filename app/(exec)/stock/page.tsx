import Link from "next/link";
import type { Metadata } from "next";
import { PackageCheck } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { requireExecutiveSession } from "@/lib/auth/executive";
import { getStockCategoryCounts, getStockGallery, listCategories } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Today's Stock" };
export const dynamic = "force-dynamic";

function formatUpdated(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StockPage() {
  const session = await requireExecutiveSession();
  const [categories, { stockDate }, counts] = await Promise.all([
    listCategories(),
    getStockGallery(),
    getStockCategoryCounts(),
  ]);
  const updated = formatUpdated(stockDate);

  return (
    <>
      <AppHeader title="Today's Stock" backHref="/" session={session} />
      {updated && (
        <p className="border-b border-border bg-muted/50 px-4 py-2 text-center text-[11px] font-medium text-muted-foreground">
          Stock list updated {updated}
        </p>
      )}
      <div className="px-4 py-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Pick a category to view and share today&apos;s stock photos in it.
        </p>
        {categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/stock/${category.slug}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.97]"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PackageCheck className="size-5" />
                </span>
                <div>
                  <p className="text-[15px] font-bold leading-tight">{category.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {counts.get(category.slug) ?? 0} article
                    {(counts.get(category.slug) ?? 0) === 1 ? "" : "s"}
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
