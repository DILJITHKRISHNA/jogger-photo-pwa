import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { buildExcelTemplate } from "@/lib/excel/template";
import type { ImportType } from "@/types/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES: Array<Exclude<ImportType, "photos">> = [
  "stock",
  "scheme",
  "new-model",
];

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as Exclude<ImportType, "photos"> | null;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Unknown template type" }, { status: 400 });
  }

  const buffer = buildExcelTemplate(type);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${type}-template.xlsx"`,
    },
  });
}
