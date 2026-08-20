import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ImportHistoryTable } from "@/components/admin/import-history-table";
import { listImports } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Import History" };
export const dynamic = "force-dynamic";

export default async function ImportHistoryPage() {
  const records = await listImports();

  return (
    <AdminShell title="Import History">
      <ImportHistoryTable records={records} />
    </AdminShell>
  );
}
