import { promises as fs } from "node:fs";
import path from "node:path";

import JSZip from "jszip";
import { NextResponse } from "next/server";

import { requireCatalogueReader } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ZipRequestItem {
  url: string;
  name: string;
}

async function readLocalPublicFile(url: string): Promise<Buffer> {
  const relative = url.replace(/^\/+/, "");
  const filePath = path.join(process.cwd(), "public", relative);
  return fs.readFile(filePath);
}

/** Bundles the selected product photos into one ZIP for large multi-select downloads. */
export async function POST(request: Request) {
  const unauthorized = await requireCatalogueReader();
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as { items?: ZipRequestItem[]; zipName?: string };
  const items = body.items ?? [];

  if (items.length === 0) {
    return NextResponse.json({ error: "No photos selected" }, { status: 400 });
  }
  if (items.length > 300) {
    return NextResponse.json({ error: "Too many photos selected at once" }, { status: 400 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  await Promise.all(
    items.map(async (item) => {
      try {
        const buffer = item.url.startsWith("/")
          ? await readLocalPublicFile(item.url)
          : Buffer.from(await (await fetch(item.url)).arrayBuffer());

        let name = item.name;
        let suffix = 1;
        while (usedNames.has(name)) {
          const dot = item.name.lastIndexOf(".");
          name =
            dot > 0
              ? `${item.name.slice(0, dot)} (${suffix})${item.name.slice(dot)}`
              : `${item.name} (${suffix})`;
          suffix += 1;
        }
        usedNames.add(name);
        zip.file(name, buffer);
      } catch (error) {
        console.error(`Failed to add ${item.url} to zip:`, error);
      }
    })
  );

  const content = await zip.generateAsync({ type: "nodebuffer" });
  const zipName = (body.zipName || "jogger-photos").replace(/[^a-z0-9-_]+/gi, "-");

  return new NextResponse(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}.zip"`,
    },
  });
}
