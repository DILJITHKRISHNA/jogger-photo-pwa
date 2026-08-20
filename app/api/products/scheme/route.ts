import { NextResponse } from "next/server";

import { requireCatalogueReader } from "@/lib/auth/guards";
import { getSchemeGallery } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireCatalogueReader();
  if (unauthorized) return unauthorized;

  return NextResponse.json(await getSchemeGallery());
}
