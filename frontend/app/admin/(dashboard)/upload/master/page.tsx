import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ExcelUploadPanel } from "@/components/admin/excel-upload-panel";

export const metadata: Metadata = { title: "Master Excel" };

export default function MasterUploadPage() {
  return (
    <AdminShell title="Master Excel Upload">
      <ExcelUploadPanel
        type="master"
        title="Master catalogue"
        columnsHint="Article | Colour | Category"
        replaceSemantics="Each upload fully replaces the master list. Product photos are categorised from this file — upload photos in one batch, without picking a category."
      />
    </AdminShell>
  );
}
