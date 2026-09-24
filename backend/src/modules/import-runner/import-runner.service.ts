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
      brand: r.brand,
      gender: r.gender,
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

  /** Fully replace the master list, ensure categories/brands/genders exist, re-tag photos. */
  private async importMaster(
    rows: Array<{
      article: string;
      colour: string;
      category: string | null;
      brand: string | null;
      gender: string | null;
    }>,
  ) {
    await this.ensureNames(
      'category',
      rows.map((r) => r.category),
    );
    await this.ensureNames(
      'brand',
      rows.map((r) => r.brand),
    );
    await this.ensureNames(
      'gender',
      rows.map((r) => r.gender),
    );

    await this.prisma.$transaction([
      this.prisma.masterEntry.deleteMany({}),
      this.prisma.masterEntry.createMany({
        data: rows.map((r) => ({
          article: r.article,
          colour: r.colour,
          category: (r.category ?? '').trim(),
          brand: r.brand?.trim() || null,
          gender: r.gender?.trim() || null,
        })),
      }),
    ]);

    await this.applyMasterTags();
  }

  /** Create any category / brand / gender named in the sheet that doesn't exist yet (in sheet order). */
  private async ensureNames(kind: 'category' | 'brand' | 'gender', values: Array<string | null>) {
    const names = [
      ...new Set(values.map((v) => v?.trim()).filter((name): name is string => Boolean(name))),
    ];
    if (names.length === 0) return;

    const delegate =
      kind === 'category'
        ? this.prisma.category
        : kind === 'brand'
          ? this.prisma.brand
          : this.prisma.gender;
    const existing = await (delegate as typeof this.prisma.category).findMany();
    const slugs = new Set(existing.map((e) => e.slug));
    let sortOrder = existing.length;

    for (const name of names) {
      const slug = slugify(name);
      if (!slug || slugs.has(slug)) continue;
      await (delegate as typeof this.prisma.category).create({ data: { name, slug, sortOrder } });
      slugs.add(slug);
      sortOrder += 1;
    }
  }

  /** Assign every product photo's category / brand / gender from the current master Excel. */
  private async applyMasterTags() {
    const [master, categories, brands, genders] = await Promise.all([
      this.prisma.masterEntry.findMany(),
      this.prisma.category.findMany(),
      this.prisma.brand.findMany(),
      this.prisma.gender.findMany(),
    ]);
    const idBySlug = (list: Array<{ id: string; slug: string }>) =>
      new Map(list.map((x) => [x.slug, x.id]));
    const categoryIds = idBySlug(categories);
    const brandIds = idBySlug(brands);
    const genderIds = idBySlug(genders);
    const lookup = (map: Map<string, string>, name: string | null) =>
      name ? (map.get(slugify(name)) ?? null) : null;

    const tagsByKey = new Map<
      string,
      { categoryId: string | null; brandId: string | null; genderId: string | null }
    >();
    for (const row of master) {
      tagsByKey.set(`${row.article}::${row.colour}`, {
        categoryId: lookup(categoryIds, row.category),
        brandId: lookup(brandIds, row.brand),
        genderId: lookup(genderIds, row.gender),
      });
    }

    const products = await this.prisma.product.findMany({
      select: { id: true, article: true, colour: true, categoryId: true, brandId: true, genderId: true },
    });
    const empty = { categoryId: null, brandId: null, genderId: null };

    const updates = products.filter((p) => {
      const next = tagsByKey.get(`${p.article}::${p.colour}`) ?? empty;
      return (
        next.categoryId !== p.categoryId || next.brandId !== p.brandId || next.genderId !== p.genderId
      );
    });
    if (updates.length === 0) return;

    await this.prisma.$transaction(
      updates.map((p) =>
        this.prisma.product.update({
          where: { id: p.id },
          data: tagsByKey.get(`${p.article}::${p.colour}`) ?? empty,
        }),
      ),
    );
  }
}
