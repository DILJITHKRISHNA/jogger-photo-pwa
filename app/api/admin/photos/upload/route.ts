import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { addImportRecord, getProductByKey, upsertProduct } from "@/lib/db/repository";
import { parsePhotoFilename } from "@/lib/parse-photo-filename";
import { uploadProductPhoto } from "@/lib/storage";
import type { ImportErrorRow } from "@/types/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const categoryId = (formData.get("categoryId") as string | null) || null;
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No photos were selected" }, { status: 400 });
  }

  const errors: ImportErrorRow[] = [];
  const uploaded: Array<{ article: string; colour: string; photoUrl: string; replaced: boolean }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const parsed = parsePhotoFilename(file.name);

    if (!parsed.ok) {
      errors.push({ row: i + 1, message: `${parsed.original}: ${parsed.reason}` });
      continue;
    }

    try {
      const existing = await getProductByKey(parsed.article, parsed.colour);
      const buffer = Buffer.from(await file.arrayBuffer());
      const { url } = await uploadProductPhoto({
        article: parsed.article,
        colour: parsed.colour,
        ext: parsed.ext,
        buffer,
        contentType: file.type || CONTENT_TYPES[parsed.ext] || "application/octet-stream",
      });

      await upsertProduct({
        article: parsed.article,
        colour: parsed.colour,
        categoryId,
        photoUrl: url,
        photoFilename: parsed.original,
      });

      uploaded.push({
        article: parsed.article,
        colour: parsed.colour,
        photoUrl: url,
        replaced: Boolean(existing),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      errors.push({
        row: i + 1,
        message: `${parsed.original}: ${message}`,
        article: parsed.article,
        colour: parsed.colour,
      });
    }
  }

  const record = await addImportRecord({
    type: "photos",
    filename: files.length === 1 ? files[0].name : `${files.length} photos`,
    total: files.length,
    success: uploaded.length,
    errorCount: errors.length,
    errors,
    missingPhotos: [],
  });

  return NextResponse.json({
    importId: record.id,
    total: files.length,
    success: uploaded.length,
    newCount: uploaded.filter((u) => !u.replaced).length,
    replacedCount: uploaded.filter((u) => u.replaced).length,
    errorCount: errors.length,
    errors,
    uploaded,
  });
}
