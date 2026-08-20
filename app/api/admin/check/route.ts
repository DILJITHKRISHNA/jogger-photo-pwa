import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { checkProductStatus } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const article = searchParams.get("article") ?? "";
  const colour = searchParams.get("colour") ?? "";

  if (!article || !colour) {
    return NextResponse.json(
      { error: "Both article and colour are required" },
      { status: 400 }
    );
  }

  return NextResponse.json(await checkProductStatus(article, colour));
}
