import Link from "next/link";
import type { Metadata } from "next";
import { Images } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { requireExecutiveSession } from "@/lib/auth/executive";
import { listCategories, listProducts } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Bulk Photos" };
export const dynamic = "force-dynamic";

export default async function CategoryIndexPage() {
  const session = await requireExecutiveSession();
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts({ activeOnly: true }),
  ]);

  const counts = new Map<string, number>();
  for (const product of products) {
    if (!product.categoryId) continue;
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }

  return (
    <>
      <AppHeader title="Bulk Photos" backHref="/" session={session} />
      <div className="px-4 py-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Pick a category to view and share every photo in it.
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
                href={`/category/${category.slug}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.97]"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Images className="size-5" />
                </span>
                <div>
                  <p className="text-[15px] font-bold leading-tight">{category.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {counts.get(category.id) ?? 0} photo{(counts.get(category.id) ?? 0) === 1 ? "" : "s"}
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
