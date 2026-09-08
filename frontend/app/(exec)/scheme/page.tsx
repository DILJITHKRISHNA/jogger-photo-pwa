"use client";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { useGallery } from "@/features/catalogue/use-gallery";

export default function SchemePage() {
  const { items, loading } = useGallery("/catalogue/scheme");

  return (
    <>
      <AppHeader title="Scheme Articles" backHref="/" />
      {!loading && (
        <ProductGallery
          items={items}
          zipName="Scheme-Articles"
          groupByCategory
          emptyTitle="No scheme articles yet"
          emptyHint="Ask your admin to upload the scheme Excel."
        />
      )}
    </>
  );
}
