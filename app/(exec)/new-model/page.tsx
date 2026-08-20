import type { Metadata } from "next";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { requireExecutiveSession } from "@/lib/auth/executive";
import { getNewModelGallery } from "@/lib/db/repository";

export const metadata: Metadata = { title: "New Model" };
export const dynamic = "force-dynamic";

export default async function NewModelPage() {
  const session = await requireExecutiveSession();
  const items = await getNewModelGallery();

  return (
    <>
      <AppHeader title="New Model" backHref="/" session={session} />
      <ProductGallery
        items={items}
        zipName="New-Model"
        groupByCategory
        emptyTitle="No new models yet"
        emptyHint="Ask your admin to upload the new model Excel."
      />
    </>
  );
}
