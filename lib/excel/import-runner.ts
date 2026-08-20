import { parseProductExcel } from "@/lib/excel/parse";
import {
  addImportRecord,
  listProducts,
  replaceStock,
  upsertNewModelEntries,
  upsertSchemeEntries,
} from "@/lib/db/repository";
import { productKey } from "@/lib/product-key";
import type { ImportRecord } from "@/types/product";

export interface ExcelImportOutcome {
  fatal?: string;
  record?: ImportRecord;
}

/**
 * Shared Excel import pipeline for Stock / Scheme / New Model uploads:
 * validate → import/update the matching table → cross-check against the
 * photo catalogue → record the result for Import History.
 */
export async function runExcelImport(
  type: "stock" | "scheme" | "new-model",
  filename: string,
  buffer: Buffer
): Promise<ExcelImportOutcome> {
  const parsed = parseProductExcel(buffer);
  if (parsed.fatal) {
    return { fatal: parsed.fatal };
  }

  const activeProducts = await listProducts({ activeOnly: true });
  const photoKeys = new Set(
    activeProducts.map((p) => productKey(p.article, p.colour))
  );

  const missingPhotos = Array.from(
    new Set(
      parsed.rows
        .filter((r) => !photoKeys.has(productKey(r.article, r.colour)))
        .map((r) => `${r.article} ${r.colour}`)
    )
  );

  if (type === "stock") {
    await replaceStock(
      parsed.rows.map((r) => ({
        article: r.article,
        colour: r.colour,
        category: r.category,
      }))
    );
  } else if (type === "scheme") {
    await upsertSchemeEntries(parsed.rows);
  } else {
    await upsertNewModelEntries(parsed.rows);
  }

  const record = await addImportRecord({
    type,
    filename,
    total: parsed.total,
    success: parsed.rows.length,
    errorCount: parsed.errors.length,
    errors: parsed.errors,
    missingPhotos,
  });

  return { record };
}
