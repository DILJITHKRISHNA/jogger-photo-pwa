import { NextResponse } from "next/server";

import {
  isValidAdminPassword,
  setAdminAuthCookie,
} from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };

    if (!body.password || !isValidAdminPassword(body.password)) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    await setAdminAuthCookie(request);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
