import { NextResponse } from "next/server";

import { requireCatalogueReader } from "@/lib/auth/guards";
import { searchByArticle } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireCatalogueReader();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const article = searchParams.get("article") ?? "";
  return NextResponse.json(await searchByArticle(article));
}
