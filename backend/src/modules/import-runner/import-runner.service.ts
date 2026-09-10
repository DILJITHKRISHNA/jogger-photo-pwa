import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelService } from '../excel/excel.service';
import { ImportsService } from '../imports/imports.service';
import { normalizeArticle, normalizeColour, labelFor } from '../../common/util/product-key';
import { slugify } from '../categories/categories.service';
import type { ImportRecord } from '../../generated/prisma/client';

export type ImportKind = 'stock' | 'scheme' | 'new-model' | 'master';

export interface ImportOutcome {
  fatal?: string;
  record?: ImportRecord;
}

const TYPE_MAP = {
  stock: 'STOCK',
  scheme: 'SCHEME',
  'new-model': 'NEW_MODEL',
  master: 'MASTER',
} as const;

/**
 * Shared Excel import pipeline for Stock / Scheme / New Model / Master
 * uploads: validate → import/update the matching table → cross-check
 * against the photo catalogue → record the result for Import History.
 */
@Injectable()
export class ImportRunnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excel: ExcelService,
    private readonly imports: ImportsService,
  ) {}

  async run(kind: ImportKind, filename: string, buffer: Buffer): Promise<ImportOutcome> {
    const parsed = this.excel.parseProductExcel(buffer, {
      requireCategory: kind === 'master',
    });
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

    if (kind === 'master') {
      await this.importMaster(rows);
    } else if (kind === 'stock') {
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

  /** Fully replace the master list, ensure categories exist, recategorise photos. */
  private async importMaster(
    rows: Array<{ article: string; colour: string; category: string | null }>,
  ) {
    const names = [
      ...new Set(rows.map((r) => r.category?.trim()).filter((name): name is string => Boolean(name))),
    ];
    const existing = await this.prisma.category.findMany();
    const bySlug = new Map(existing.map((c) => [c.slug, c]));
    let sortOrder = existing.length;

    for (const name of names) {
      const slug = slugify(name);
      if (!slug || bySlug.has(slug)) continue;
      const created = await this.prisma.category.create({
        data: { name, slug, sortOrder },
      });
      bySlug.set(slug, created);
      sortOrder += 1;
    }

    await this.prisma.$transaction([
      this.prisma.masterEntry.deleteMany({}),
      this.prisma.masterEntry.createMany({
        data: rows.map((r) => ({
          article: r.article,
          colour: r.colour,
          category: (r.category ?? '').trim(),
        })),
      }),
    ]);

    await this.applyMasterCategories();
  }

  /** Assign every product photo's category from the current master Excel. */
  private async applyMasterCategories() {
    const [master, categories] = await Promise.all([
      this.prisma.masterEntry.findMany(),
      this.prisma.category.findMany(),
    ]);
    const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
    const categoryIdByKey = new Map<string, string | null>();
    for (const row of master) {
      categoryIdByKey.set(
        `${row.article}::${row.colour}`,
        categoryIdBySlug.get(slugify(row.category)) ?? null,
      );
    }

    const products = await this.prisma.product.findMany({
      select: { id: true, article: true, colour: true, categoryId: true },
    });

    const updates = products.filter((product) => {
      const next = categoryIdByKey.get(`${product.article}::${product.colour}`) ?? null;
      return next !== product.categoryId;
    });

    if (updates.length === 0) return;

    await this.prisma.$transaction(
      updates.map((product) =>
        this.prisma.product.update({
          where: { id: product.id },
          data: {
            categoryId: categoryIdByKey.get(`${product.article}::${product.colour}`) ?? null,
          },
        }),
      ),
    );
  }
}
