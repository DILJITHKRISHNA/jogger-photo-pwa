import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { requireExecutiveSession } from "@/lib/auth/executive";
import { getStockGallery, listCategories } from "@/lib/db/repository";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await listCategories({ includeHidden: true });
  const category = categories.find((c) => c.slug === slug);
  return { title: category?.name ?? "Today's Stock" };
}

export default async function StockCategoryGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireExecutiveSession();
  const categories = await listCategories({ includeHidden: true });
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const { items, stockDate } = await getStockGallery(slug);
  const updated = formatUpdated(stockDate);

  return (
    <>
      <AppHeader title={category.name} backHref="/stock" session={session} />
      {updated && (
        <p className="border-b border-border bg-muted/50 px-4 py-2 text-center text-[11px] font-medium text-muted-foreground">
          Stock list updated {updated}
        </p>
      )}
      <ProductGallery
        items={items}
        zipName={`Todays-Stock-${category.name}`}
        emptyTitle="No stock in this category today"
        emptyHint="Ask your admin to upload today's stock Excel."
      />
    </>
  );
}
