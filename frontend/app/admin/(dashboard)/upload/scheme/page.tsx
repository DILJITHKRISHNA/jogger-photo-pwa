import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ExcelUploadPanel } from "@/components/admin/excel-upload-panel";

export const metadata: Metadata = { title: "Scheme Excel" };

export default function SchemeUploadPage() {
  return (
    <AdminShell title="Scheme Excel Upload">
      <ExcelUploadPanel
        type="scheme"
        title="Scheme Articles"
        columnsHint="Article | Colour | Size (e.g. 6x10, or 6x10, 7x10)"
        replaceSemantics="New rows are added and existing ones updated (including their sizes) — nothing is removed automatically. Executives see scheme articles grouped by Size."
      />
    </AdminShell>
  );
}
