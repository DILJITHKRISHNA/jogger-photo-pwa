"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { ImportHistoryTable } from "@/components/admin/import-history-table";

export default function ImportHistoryPage() {
  return (
    <AdminShell title="Import History">
      <ImportHistoryTable />
    </AdminShell>
  );
}
