import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { getImportById } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${cell.replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\r\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const record = await getImportById(id);
  if (!record) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  const csv = toCsv([
    ["Row", "Article", "Colour", "Error"],
    ...record.errors.map((e) => [
      String(e.row),
      e.article ?? "",
      e.colour ?? "",
      e.message,
    ]),
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${record.type}-import-errors-${record.id}.csv"`,
    },
  });
}
