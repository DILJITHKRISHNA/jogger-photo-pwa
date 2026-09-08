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
        columnsHint="Article | Colour"
        replaceSemantics="New rows are added and existing ones updated — nothing is removed automatically."
      />
    </AdminShell>
  );
}
