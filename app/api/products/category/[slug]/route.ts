import { NextResponse } from "next/server";

import { requireCatalogueReader } from "@/lib/auth/guards";
import { getCategoryGallery } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const unauthorized = await requireCatalogueReader();
  if (unauthorized) return unauthorized;

  const { slug } = await params;
  return NextResponse.json(await getCategoryGallery(slug));
}
