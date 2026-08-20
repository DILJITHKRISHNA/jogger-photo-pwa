import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ExcelUploadPanel } from "@/components/admin/excel-upload-panel";

export const metadata: Metadata = { title: "New Model Excel" };

export default function NewModelUploadPage() {
  return (
    <AdminShell title="New Model Excel Upload">
      <ExcelUploadPanel
        type="new-model"
        title="New Model"
        columnsHint="Article | Colour"
        replaceSemantics="New rows are added and existing ones updated — nothing is removed automatically."
      />
    </AdminShell>
  );
}
