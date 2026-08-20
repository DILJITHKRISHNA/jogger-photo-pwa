import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { PhotosManager } from "@/components/admin/photos-manager";
import { listCategories, listProducts } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Photos" };
export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const [products, categories] = await Promise.all([
    listProducts(),
    listCategories({ includeHidden: true }),
  ]);

  return (
    <AdminShell title="Photos">
      <PhotosManager initialProducts={products} categories={categories} />
    </AdminShell>
  );
}
