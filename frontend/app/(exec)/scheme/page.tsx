"use client";

import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { SizeGrid } from "@/components/executive/size-grid";
import { sizeGroupsFromItems, useGallery } from "@/features/catalogue/use-gallery";

export default function SchemePage() {
  const { items, loading } = useGallery("/catalogue/scheme");

  if (loading) {
    return (
      <>
        <AppHeader title="Scheme Articles" backHref="/" />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  // Scheme articles are grouped by Size. If none of them has a size yet, show the photos directly.
  const sizeGroups = sizeGroupsFromItems(items);
  if (sizeGroups.length > 0) {
    return (
      <>
        <AppHeader title="Scheme Articles" backHref="/" />
        <SizeGrid baseHref="/scheme" groups={sizeGroups} totalCount={items.length} />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Scheme Articles" backHref="/" />
      <ProductGallery
        items={items}
        zipName="Scheme-Articles"
        groupByCategory
        emptyTitle="No scheme articles yet"
        emptyHint="Ask your admin to upload the scheme Excel."
      />
    </>
  );
}
