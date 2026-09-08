import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ParsedExcelRow {
  row: number; // 1-indexed row number as it appears in the spreadsheet
  article: string;
  colour: string;
  category: string | null;
}

export interface ImportErrorRow {
  row: number;
  message: string;
  article?: string;
  colour?: string;
}

export interface ParsedExcelResult {
  total: number;
  rows: ParsedExcelRow[];
  errors: ImportErrorRow[];
  fatal?: string;
}

const HEADER_ALIASES: Record<'article' | 'colour' | 'category', string[]> = {
  article: [
    'article',
    'articleno',
    'articlenumber',
    'articlenum',
    'sku',
    'item',
    'itemcode',
    'itemno',
    'model',
  ],
  colour: ['colour', 'color'],
  category: ['category', 'cat', 'group', 'section'],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function findHeaderRow(
  matrix: unknown[][],
): { index: number; columns: Partial<Record<'article' | 'colour' | 'category', number>> } | null {
  const maxScan = Math.min(matrix.length, 10);

  for (let r = 0; r < maxScan; r++) {
    const row = matrix[r] ?? [];
    const columns: Partial<Record<'article' | 'colour' | 'category', number>> = {};

    row.forEach((cell, c) => {
      const normalized = normalizeHeader(cell);
      if (!normalized) return;
      (Object.keys(HEADER_ALIASES) as Array<keyof typeof HEADER_ALIASES>).forEach((field) => {
        if (columns[field] !== undefined) return;
        if (HEADER_ALIASES[field].includes(normalized)) {
          columns[field] = c;
        }
      });
    });

    if (columns.article !== undefined && columns.colour !== undefined) {
      return { index: r, columns };
    }
  }

  return null;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isBlankRow(row: unknown[]): boolean {
  return row.every((cell) => cellToString(cell) === '');
}

/**
 * Parses an uploaded Excel/CSV buffer into Article/Colour(/Category) rows.
 * Invalid rows are reported as errors, never silently imported.
 */
@Injectable()
export class ExcelService {
  parseProductExcel(buffer: Buffer): ParsedExcelResult {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      return {
        total: 0,
        rows: [],
        errors: [],
        fatal: 'Could not read this file. Please upload a valid .xlsx, .xls or .csv file.',
      };
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    if (!sheet) {
      return { total: 0, rows: [], errors: [], fatal: 'The workbook has no sheets.' };
    }

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    const header = findHeaderRow(matrix);
    if (!header) {
      return {
        total: 0,
        rows: [],
        errors: [],
        fatal: 'Could not find "Article" and "Colour" columns. Check the header row and try again.',
      };
    }

    const rows: ParsedExcelRow[] = [];
    const errors: ImportErrorRow[] = [];
    let total = 0;

    for (let r = header.index + 1; r < matrix.length; r++) {
      const raw = matrix[r] ?? [];
      if (isBlankRow(raw)) continue;

      total += 1;
      const rowNumber = r + 1;

      const article = cellToString(raw[header.columns.article!]);
      const colour = cellToString(raw[header.columns.colour!]);
      const category =
        header.columns.category !== undefined
          ? cellToString(raw[header.columns.category]) || null
          : null;

      if (!article && !colour) {
        errors.push({ row: rowNumber, message: 'Missing Article and Colour' });
        continue;
      }
      if (!article) {
        errors.push({ row: rowNumber, message: 'Missing Article', colour });
        continue;
      }
      if (!colour) {
        errors.push({ row: rowNumber, message: 'Missing Colour', article });
        continue;
      }

      rows.push({ row: rowNumber, article, colour, category });
    }

    return { total, rows, errors };
  }

  buildTemplate(type: 'stock' | 'scheme' | 'new-model'): Buffer {
    const templates = {
      stock: {
        sheetName: 'STOCK EXCEL',
        header: ['Article', 'Colour', 'Category'],
        sample: [
          ['111', 'LGRY', 'EVA'],
          ['222', 'DGRN', 'EVA'],
          ['222', 'KAKI', 'EVA'],
        ],
      },
      scheme: {
        sheetName: 'SCHEME ARTICLE',
        header: ['Article', 'Colour'],
        sample: [
          ['111', 'LGRY'],
          ['222', 'DGRN'],
          ['222', 'KAKI'],
        ],
      },
      'new-model': {
        sheetName: 'NEW MODEL',
        header: ['Article', 'Colour'],
        sample: [
          ['SS5013', 'BRWN'],
          ['JM1266', 'BRWN'],
          ['JB3803', 'GREY'],
        ],
      },
    } as const;

    const config = templates[type];
    const aoa: string[][] = [[...config.header], ...config.sample.map((row) => [...row])];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!cols'] = config.header.map(() => ({ wch: 16 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
