import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelService } from '../excel/excel.service';
import { ImportsService } from '../imports/imports.service';
import { normalizeArticle, normalizeColour, labelFor } from '../../common/util/product-key';
import type { ImportRecord } from '../../generated/prisma/client';

export type ImportKind = 'stock' | 'scheme' | 'new-model';

export interface ImportOutcome {
  fatal?: string;
  record?: ImportRecord;
}

const TYPE_MAP = { stock: 'STOCK', scheme: 'SCHEME', 'new-model': 'NEW_MODEL' } as const;

/**
 * Shared Excel import pipeline for Stock / Scheme / New Model uploads:
 * validate → import/update the matching table → cross-check against the
 * photo catalogue → record the result for Import History.
 */
@Injectable()
export class ImportRunnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excel: ExcelService,
    private readonly imports: ImportsService,
  ) {}

  async run(kind: ImportKind, filename: string, buffer: Buffer): Promise<ImportOutcome> {
    const parsed = this.excel.parseProductExcel(buffer);
    if (parsed.fatal) return { fatal: parsed.fatal };

    const rows = parsed.rows.map((r) => ({
      row: r.row,
      article: normalizeArticle(r.article),
      colour: normalizeColour(r.colour),
      category: r.category,
    }));

    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: { article: true, colour: true },
    });
    const photoKeys = new Set(products.map((p) => `${p.article}::${p.colour}`));
    const missingPhotos = Array.from(
      new Set(
        rows
          .filter((r) => !photoKeys.has(`${r.article}::${r.colour}`))
          .map((r) => labelFor(r.article, r.colour)),
      ),
    );

    if (kind === 'stock') {
      await this.prisma.$transaction([
        this.prisma.stockEntry.deleteMany({}),
        this.prisma.stockEntry.createMany({
          data: rows.map((r) => ({ article: r.article, colour: r.colour, category: r.category })),
        }),
      ]);
    } else if (kind === 'scheme') {
      await this.prisma.$transaction(
        rows.map((r) =>
          this.prisma.schemeEntry.upsert({
            where: { article_colour: { article: r.article, colour: r.colour } },
            create: { article: r.article, colour: r.colour },
            update: {},
          }),
        ),
      );
    } else {
      await this.prisma.$transaction(
        rows.map((r) =>
          this.prisma.newModelEntry.upsert({
            where: { article_colour: { article: r.article, colour: r.colour } },
            create: { article: r.article, colour: r.colour },
            update: {},
          }),
        ),
      );
    }

    const record = await this.imports.create({
      type: TYPE_MAP[kind],
      filename,
      total: parsed.total,
      success: rows.length,
      errorCount: parsed.errors.length,
      errors: parsed.errors,
      missingPhotos,
    });

    return { record };
  }
}
