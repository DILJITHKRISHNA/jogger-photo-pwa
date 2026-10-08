"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { useCategories } from "@/features/catalogue/use-categories";
import {
  decodeParam,
  itemsForSize,
  sizeLabel,
  stockItemsForCategory,
  UNCATEGORISED_SLUG,
  useStockGallery,
} from "@/features/catalogue/use-gallery";

export default function StockSizeGalleryPage() {
  const params = useParams<{ slug: string; size: string }>();
  const slug = params.slug;
  const size = decodeParam(params.size);
  const { categories, loading: categoriesLoading } = useCategories(true);
  const { items, loading: stockLoading } = useStockGallery();

  const category = categories.find((c) => c.slug === slug);
  const categoryName =
    slug === UNCATEGORISED_SLUG
      ? "Uncategorised"
      : (category?.name ?? (categoriesLoading ? "" : "Category"));
  const title = categoryName ? `${categoryName} · ${sizeLabel(size)}` : "";
  const backHref = `/stock/${slug}`;

  if (categoriesLoading || stockLoading) {
    return (
      <>
        <AppHeader title={title || "Loading…"} backHref={backHref} />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={title} backHref={backHref} />
      <ProductGallery
        items={itemsForSize(stockItemsForCategory(items, slug), size)}
        zipName={`Todays-Stock-${categoryName || "Category"}-${sizeLabel(size)}`}
        emptyTitle="No stock photos in this size"
        emptyHint="Ask your admin to check the Size column in today's stock Excel."
      />
    </>
  );
}
