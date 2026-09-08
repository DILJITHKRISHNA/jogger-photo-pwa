"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { PhotoViewer } from "@/components/executive/photo-viewer";
import { useProduct } from "@/features/catalogue/use-product";

export default function ProductPage() {
  const { article, colour } = useParams<{ article: string; colour: string }>();
  const { product, loading } = useProduct(decodeURIComponent(article), decodeURIComponent(colour));

  return (
    <>
      <AppHeader title="Photo" backHref="/search" />
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !product ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-8 py-16 text-center">
          <p className="text-sm font-bold text-foreground">Photo not found</p>
          <p className="text-xs text-muted-foreground">
            This article/colour doesn&apos;t have a photo yet.
          </p>
        </div>
      ) : (
        <PhotoViewer
          article={product.article}
          colour={product.colour}
          category={product.category}
          photoUrl={product.photoUrl}
        />
      )}
    </>
  );
}
