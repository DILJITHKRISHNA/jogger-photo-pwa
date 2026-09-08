"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { useCategories } from "@/features/catalogue/use-categories";
import { useGallery } from "@/features/catalogue/use-gallery";

export default function CategoryGalleryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, loading: categoriesLoading } = useCategories(true);
  const { items, loading: itemsLoading } = useGallery(`/catalogue/categories/${slug}`);

  const category = categories.find((c) => c.slug === slug);
  const title = category?.name ?? (categoriesLoading ? "" : "Category");

  if (categoriesLoading || itemsLoading) {
    return (
      <>
        <AppHeader title={title || "Loading…"} backHref="/category" />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={title} backHref="/category" />
      <ProductGallery
        items={items}
        zipName={title || "Category"}
        emptyTitle="No photos in this category yet"
        emptyHint="Ask your admin to upload photos for this category."
      />
    </>
  );
}
