"use client";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { useGallery } from "@/features/catalogue/use-gallery";

export default function NewModelPage() {
  const { items, loading } = useGallery("/catalogue/new-models");

  return (
    <>
      <AppHeader title="New Model" backHref="/" />
      {!loading && (
        <ProductGallery
          items={items}
          zipName="New-Model"
          groupByCategory
          emptyTitle="No new models yet"
          emptyHint="Ask your admin to upload the new model Excel."
        />
      )}
    </>
  );
}
