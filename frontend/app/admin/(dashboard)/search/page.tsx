import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { CheckPanel } from "@/components/admin/check-panel";

export const metadata: Metadata = { title: "Search / Check" };

export default function AdminSearchPage() {
  return (
    <AdminShell title="Search / Check">
      <p className="mb-4 max-w-xl text-sm text-muted-foreground">
        Look up one Article + Colour to see its full status — photo, category, stock, scheme and
        new model — exactly what the executive app would show.
      </p>
      <CheckPanel />
    </AdminShell>
  );
}
