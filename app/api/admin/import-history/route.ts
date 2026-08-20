import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { listImports } from "@/lib/db/repository";
import type { ImportType } from "@/types/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") as ImportType | null) ?? undefined;

  return NextResponse.json(await listImports(type));
}
