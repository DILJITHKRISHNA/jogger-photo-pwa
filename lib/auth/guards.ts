import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth/admin";
import { getExecutiveSession } from "@/lib/auth/executive";

/** Returns a 401 response if the request is not from an authenticated admin, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdminAuthenticated()) return null;
  return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 });
}

/** Executives *and* admins (previewing) are allowed to read the catalogue. */
export async function requireCatalogueReader(): Promise<NextResponse | null> {
  if (await isAdminAuthenticated()) return null;
  if (await getExecutiveSession()) return null;
  return NextResponse.json({ error: "Sign-in required" }, { status: 401 });
}
