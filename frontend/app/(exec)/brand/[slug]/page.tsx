"use client";

import { useParams } from "next/navigation";

import { GroupGallery } from "@/components/executive/group-gallery";

export default function BrandGalleryPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <GroupGallery
      kind="brands"
      slug={slug}
      backHref="/brand"
      fallbackTitle="Brand"
      emptyTitle="No photos for this brand yet"
    />
  );
}
