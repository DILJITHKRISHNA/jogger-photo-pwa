import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { listCategories } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listCategories({ includeHidden: true });

  return (
    <AdminShell title="Categories">
      <p className="mb-4 max-w-xl text-sm text-muted-foreground">
        Categories power Bulk Photos and the photo upload picker. Hidden categories stay out of
        the executive app but keep their photos.
      </p>
      <CategoriesManager initialCategories={categories} />
    </AdminShell>
  );
}
