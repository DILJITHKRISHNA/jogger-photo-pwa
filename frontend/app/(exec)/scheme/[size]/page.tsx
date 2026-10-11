"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import {
  decodeParam,
  itemsForSize,
  sizeLabel,
  useGallery,
} from "@/features/catalogue/use-gallery";

export default function SchemeSizeGalleryPage() {
  const params = useParams<{ size: string }>();
  const size = decodeParam(params.size);
  const { items, loading } = useGallery("/catalogue/scheme");
  const title = `Scheme · ${sizeLabel(size)}`;

  if (loading) {
    return (
      <>
        <AppHeader title={title} backHref="/scheme" />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={title} backHref="/scheme" />
      <ProductGallery
        items={itemsForSize(items, size)}
        zipName={`Scheme-${sizeLabel(size)}`}
        groupByCategory
        emptyTitle="No scheme articles in this size"
        emptyHint="Ask your admin to check the Size column in the scheme Excel."
      />
    </>
  );
}
