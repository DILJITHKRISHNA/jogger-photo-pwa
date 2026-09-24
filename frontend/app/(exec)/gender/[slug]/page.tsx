"use client";

import { useParams } from "next/navigation";

import { GroupGallery } from "@/components/executive/group-gallery";

export default function GenderGalleryPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <GroupGallery
      kind="genders"
      slug={slug}
      backHref="/gender"
      fallbackTitle="Gender"
      emptyTitle="No photos for this section yet"
    />
  );
}
