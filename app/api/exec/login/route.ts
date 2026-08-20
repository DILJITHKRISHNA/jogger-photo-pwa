import { NextResponse } from "next/server";

import {
  isValidExecutiveAccessCode,
  setExecutiveSessionCookie,
} from "@/lib/auth/executive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      employeeId?: string;
      accessCode?: string;
    };

    const name = body.name?.trim();
    const employeeId = body.employeeId?.trim();
    const accessCode = body.accessCode ?? "";

    if (!name || !employeeId) {
      return NextResponse.json(
        { error: "Enter your name and employee ID" },
        { status: 400 }
      );
    }
    if (!isValidExecutiveAccessCode(accessCode)) {
      return NextResponse.json({ error: "Incorrect access code" }, { status: 401 });
    }

    await setExecutiveSessionCookie(request, { name, employeeId });
    return NextResponse.json({ success: true, name, employeeId });
  } catch (error) {
    console.error("Executive login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
