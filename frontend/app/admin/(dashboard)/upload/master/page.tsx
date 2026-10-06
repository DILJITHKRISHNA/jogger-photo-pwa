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
        columnsHint="Article | Colour | Category | Brand | Gender | Size (Brand, Gender and Size are optional)"
        replaceSemantics="Each upload fully replaces the master list. Photos are categorised — and tagged with Brand and Gender for the Brand / Gender boxes — from this file. Size (e.g. 6x10, 7x10) adds a size level inside each category; list several sizes with commas or on repeated rows. Upload photos in one batch."
      />
    </AdminShell>
  );
}
