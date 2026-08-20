import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { deleteCategory, updateCategory } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = (await request.json()) as { name?: string; hidden?: boolean };
  const category = await updateCategory(id, body);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const deleted = await deleteCategory(id);
  if (!deleted) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
