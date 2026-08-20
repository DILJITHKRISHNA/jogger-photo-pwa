import { NextResponse } from "next/server";

import { clearAdminAuthCookie } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearAdminAuthCookie();
  return NextResponse.json({ success: true });
}
