"use client";

import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { useGallery } from "@/features/catalogue/use-gallery";
import { useGroups, type GroupKind } from "@/features/catalogue/use-groups";

/** Photo gallery for one Brand or Gender (select / share / download, like a category). */
export function GroupGallery({
  kind,
  slug,
  backHref,
  fallbackTitle,
  emptyTitle,
}: {
  kind: GroupKind;
  slug: string;
  backHref: string;
  fallbackTitle: string;
  emptyTitle: string;
}) {
  const { groups, loading: groupsLoading } = useGroups(kind);
  const { items, loading: itemsLoading } = useGallery(`/catalogue/${kind}/${slug}`);

  const name = groups.find((g) => g.slug === slug)?.name;
  const title = name ?? (groupsLoading ? "Loading…" : fallbackTitle);

  if (groupsLoading || itemsLoading) {
    return (
      <>
        <AppHeader title={title} backHref={backHref} />
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
        items={items}
        zipName={title}
        emptyTitle={emptyTitle}
        emptyHint="Ask your admin to include this in the Master Excel and upload the photos."
      />
    </>
  );
}
