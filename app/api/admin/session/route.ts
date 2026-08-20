import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminAuthenticated() });
}
