"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { useCategories } from "@/features/catalogue/use-categories";
import {
  stockItemsForCategory,
  UNCATEGORISED_SLUG,
  useStockGallery,
} from "@/features/catalogue/use-gallery";

export default function StockCategoryGalleryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, loading: categoriesLoading } = useCategories(true);
  const { items, loading: stockLoading } = useStockGallery();

  const category = categories.find((c) => c.slug === slug);
  const title =
    slug === UNCATEGORISED_SLUG
      ? "Uncategorised"
      : (category?.name ?? (categoriesLoading ? "" : "Category"));
  const galleryItems = stockItemsForCategory(items, slug);

  if (categoriesLoading || stockLoading) {
    return (
      <>
        <AppHeader title={title || "Loading…"} backHref="/stock" />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={title} backHref="/stock" />
      <ProductGallery
        items={galleryItems}
        zipName={`Todays-Stock-${title || "Category"}`}
        emptyTitle="No stock photos in this category"
        emptyHint="Ask your admin to upload today's stock Excel or photos for this category."
      />
    </>
  );
}
