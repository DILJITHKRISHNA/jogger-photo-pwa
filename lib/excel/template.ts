import * as XLSX from "xlsx";

import type { ImportType } from "@/types/product";

const TEMPLATES: Record<
  Exclude<ImportType, "photos">,
  { sheetName: string; header: string[]; sample: (string | number)[][] }
> = {
  stock: {
    sheetName: "STOCK EXCEL",
    header: ["Article", "Colour", "Category"],
    sample: [
      ["111", "LGRY", "EVA"],
      ["222", "DGRN", "EVA"],
      ["222", "KAKI", "EVA"],
    ],
  },
  scheme: {
    sheetName: "SCHEME ARTICLE",
    header: ["Article", "Colour"],
    sample: [
      ["111", "LGRY"],
      ["222", "DGRN"],
      ["222", "KAKI"],
    ],
  },
  "new-model": {
    sheetName: "NEW MODEL",
    header: ["Article", "Colour"],
    sample: [
      ["SS5013", "BRWN"],
      ["JM1266", "BRWN"],
      ["JB3803", "GREY"],
    ],
  },
};

/** Generates a ready-to-fill sample workbook matching the master Excel format from the spec. */
export function buildExcelTemplate(type: Exclude<ImportType, "photos">): Buffer {
  const config = TEMPLATES[type];
  const worksheet = XLSX.utils.aoa_to_sheet([config.header, ...config.sample]);
  worksheet["!cols"] = config.header.map(() => ({ wch: 16 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
