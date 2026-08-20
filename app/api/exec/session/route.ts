import { NextResponse } from "next/server";

import { getExecutiveSession } from "@/lib/auth/executive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getExecutiveSession();
  return NextResponse.json({ authenticated: Boolean(session), session });
}
