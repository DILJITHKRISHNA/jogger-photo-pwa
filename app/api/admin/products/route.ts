import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { listProducts } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const products = await listProducts({ categoryId });
  return NextResponse.json(products);
}
