import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ExcelUploadPanel } from "@/components/admin/excel-upload-panel";

export const metadata: Metadata = { title: "Stock Excel" };

export default function StockUploadPage() {
  return (
    <AdminShell title="Stock Excel Upload">
      <ExcelUploadPanel
        type="stock"
        title="Today's Stock"
        columnsHint="Article | Colour | Category"
        replaceSemantics="Each upload fully replaces the current stock list — this is what powers Today's Stock for executives."
      />
    </AdminShell>
  );
}
