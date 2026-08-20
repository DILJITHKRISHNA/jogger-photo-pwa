import { NextResponse } from "next/server";

import { clearExecutiveSessionCookie } from "@/lib/auth/executive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearExecutiveSessionCookie();
  return NextResponse.json({ success: true });
}
