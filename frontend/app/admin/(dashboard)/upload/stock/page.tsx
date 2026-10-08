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
        columnsHint="Article | Colour | Category | Size (Size is optional, e.g. 6x10 — several sizes separated by commas)"
        replaceSemantics="Each upload fully replaces the current stock list — this is what powers Today's Stock for executives. Inside each category, executives see one box per Size (6x10, 7x10, …); an Article + Colour can be repeated on another row with a different size."
      />
    </AdminShell>
  );
}
