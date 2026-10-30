"use client";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { useGallery } from "@/features/catalogue/use-gallery";

export default function RequestedPhotosPage() {
  const { items, loading } = useGallery("/catalogue/requested");

  return (
    <>
      <AppHeader title="Requested Photos" backHref="/" />
      {!loading && (
        <ProductGallery
          items={items}
          zipName="Requested-Photos"
          groupByCategory
          emptyTitle="No requested photos yet"
          emptyHint="Ask your admin to upload the Requested Photos Excel."
        />
      )}
    </>
  );
}
