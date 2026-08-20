import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AppHeader } from "@/components/executive/app-header";
import { PhotoViewer } from "@/components/executive/photo-viewer";
import { requireExecutiveSession } from "@/lib/auth/executive";
import { getProductByKey, listCategories } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

type Params = { article: string; colour: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { article, colour } = await params;
  return { title: `${decodeURIComponent(article)} · ${decodeURIComponent(colour)}` };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { article, colour } = await params;
  const session = await requireExecutiveSession();

  const product = await getProductByKey(decodeURIComponent(article), decodeURIComponent(colour));
  if (!product || !product.active) notFound();

  const categories = await listCategories({ includeHidden: true });
  const category = categories.find((c) => c.id === product.categoryId) ?? null;

  return (
    <>
      <AppHeader title="Photo" backHref="/search" session={session} />
      <PhotoViewer
        article={product.article}
        colour={product.colour}
        category={category?.name ?? null}
        photoUrl={product.photoUrl}
      />
    </>
  );
}
