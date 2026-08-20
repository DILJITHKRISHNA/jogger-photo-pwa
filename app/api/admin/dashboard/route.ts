import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { getDashboardStats } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return NextResponse.json(await getDashboardStats());
}
