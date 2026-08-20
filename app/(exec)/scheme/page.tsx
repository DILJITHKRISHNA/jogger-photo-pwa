import type { Metadata } from "next";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { requireExecutiveSession } from "@/lib/auth/executive";
import { getSchemeGallery } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Scheme Articles" };
export const dynamic = "force-dynamic";

export default async function SchemePage() {
  const session = await requireExecutiveSession();
  const items = await getSchemeGallery();

  return (
    <>
      <AppHeader title="Scheme Articles" backHref="/" session={session} />
      <ProductGallery
        items={items}
        zipName="Scheme-Articles"
        groupByCategory
        emptyTitle="No scheme articles yet"
        emptyHint="Ask your admin to upload the scheme Excel."
      />
    </>
  );
}
