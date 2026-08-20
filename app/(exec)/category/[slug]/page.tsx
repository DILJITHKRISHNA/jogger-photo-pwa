import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { requireExecutiveSession } from "@/lib/auth/executive";
import { getCategoryGallery, listCategories } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await listCategories({ includeHidden: true });
  const category = categories.find((c) => c.slug === slug);
  return { title: category?.name ?? "Category" };
}

export default async function CategoryGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireExecutiveSession();
  const categories = await listCategories({ includeHidden: true });
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const items = await getCategoryGallery(slug);

  return (
    <>
      <AppHeader title={category.name} backHref="/category" session={session} />
      <ProductGallery
        items={items}
        zipName={category.name}
        emptyTitle="No photos in this category yet"
        emptyHint="Ask your admin to upload photos for this category."
      />
    </>
  );
}
