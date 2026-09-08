"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { CategoriesManager } from "@/components/admin/categories-manager";

export default function AdminCategoriesPage() {
  return (
    <AdminShell title="Categories">
      <p className="mb-4 max-w-xl text-sm text-muted-foreground">
        Categories power Bulk Photos and the photo upload picker. Hidden categories stay out of
        the executive app but keep their photos.
      </p>
      <CategoriesManager />
    </AdminShell>
  );
}
