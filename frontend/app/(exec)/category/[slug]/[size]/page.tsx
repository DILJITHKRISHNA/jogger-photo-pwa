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
  useGallery,
} from "@/features/catalogue/use-gallery";

export default function CategorySizeGalleryPage() {
  const params = useParams<{ slug: string; size: string }>();
  const slug = params.slug;
  const size = decodeParam(params.size);
  const { categories, loading: categoriesLoading } = useCategories(true);
  const { items, loading: itemsLoading } = useGallery(`/catalogue/categories/${slug}`);

  const category = categories.find((c) => c.slug === slug);
  const categoryName = category?.name ?? (categoriesLoading ? "" : "Category");
  const title = categoryName ? `${categoryName} · ${sizeLabel(size)}` : "";
  const backHref = `/category/${slug}`;

  if (categoriesLoading || itemsLoading) {
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
        items={itemsForSize(items, size)}
        zipName={`${categoryName || "Category"}-${sizeLabel(size)}`}
        emptyTitle="No photos in this size yet"
        emptyHint="Ask your admin to check the Size column in the Master Excel."
      />
    </>
  );
}
