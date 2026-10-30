import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ExcelUploadPanel } from "@/components/admin/excel-upload-panel";

export const metadata: Metadata = { title: "Requested Photos Excel" };

export default function RequestedPhotosUploadPage() {
  return (
    <AdminShell title="Requested Photos Excel Upload">
      <ExcelUploadPanel
        type="requested"
        title="Requested Photos"
        columnsHint="Article | Colour"
        replaceSemantics="New rows are added and existing ones updated — nothing is removed automatically."
      />
    </AdminShell>
  );
}
