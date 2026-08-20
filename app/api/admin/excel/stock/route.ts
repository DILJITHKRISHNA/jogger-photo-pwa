import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { runExcelImport } from "@/lib/excel/import-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No Excel file was provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const outcome = await runExcelImport("stock", file.name, buffer);

  if (outcome.fatal) {
    return NextResponse.json({ error: outcome.fatal }, { status: 422 });
  }
  return NextResponse.json(outcome.record);
}
