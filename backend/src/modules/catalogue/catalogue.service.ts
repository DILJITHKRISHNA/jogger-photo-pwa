import { BadRequestException, Injectable } from '@nestjs/common';
import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeArticle, normalizeColour } from '../../common/util/product-key';
import type { Category, Product } from '../../generated/prisma/client';

export interface ZipItem {
  url: string;
  name: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface ProductView {
  id: string;
  article: string;
  colour: string;
  category: string | null;
  categorySlug: string | null;
  photoUrl: string;
}

function toView(product: Product & { category: Category | null }): ProductView {
  return {
    id: product.id,
    article: product.article,
    colour: product.colour,
    category: product.category?.name ?? null,
    categorySlug: product.category?.slug ?? null,
    photoUrl: product.photoUrl,
  };
}

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  /** Exact Article + Colour lookup — backs the full-screen photo viewer. */
  async getByKey(article: string, colour: string): Promise<ProductView | null> {
    const product = await this.prisma.product.findFirst({
      where: { active: true, article: normalizeArticle(article), colour: normalizeColour(colour) },
      include: { category: true },
    });
    return product ? toView(product) : null;
  }

  async searchByArticle(article: string): Promise<ProductView[]> {
    const needle = normalizeArticle(article);
    if (!needle) return [];
    const products = await this.prisma.product.findMany({
      where: { active: true, article: { contains: needle } },
      include: { category: true },
      orderBy: { colour: 'asc' },
    });
    return products.map(toView);
  }

  async categoryGallery(slug: string): Promise<ProductView[]> {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) return [];
    const products = await this.prisma.product.findMany({
      where: { active: true, categoryId: category.id },
      include: { category: true },
      orderBy: { article: 'asc' },
    });
    return products.map(toView);
  }

  /** Brands with their active photo counts — backs the executive Brand box. */
  async brands(): Promise<GroupSummary[]> {
    const rows = await this.prisma.brand.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { active: true } } } } },
    });
    return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, count: r._count.products }));
  }

  /** Genders with their active photo counts — backs the executive Gender box. */
  async genders(): Promise<GroupSummary[]> {
    const rows = await this.prisma.gender.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { active: true } } } } },
    });
    return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, count: r._count.products }));
  }

  async brandGallery(slug: string): Promise<ProductView[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true, brand: { slug } },
      include: { category: true },
      orderBy: { article: 'asc' },
    });
    return products.map(toView);
  }

  async genderGallery(slug: string): Promise<ProductView[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true, gender: { slug } },
      include: { category: true },
      orderBy: { article: 'asc' },
    });
    return products.map(toView);
  }

  async stockGallery(): Promise<{ items: ProductView[]; stockDate: string | null }> {
    const stock = await this.prisma.stockEntry.findMany();
    if (stock.length === 0) return { items: [], stockDate: null };

    const products = await this.prisma.product.findMany({
      where: { active: true },
      include: { category: true },
    });
    const byKey = new Map(products.map((p) => [`${p.article}::${p.colour}`, p]));

    const items: ProductView[] = [];
    for (const entry of stock) {
      const product = byKey.get(`${entry.article}::${entry.colour}`);
      if (product) items.push(toView(product));
    }

    return {
      items: items.sort((a, b) => a.article.localeCompare(b.article)),
      stockDate: stock[0]?.stockDate.toISOString() ?? null,
    };
  }

  async schemeGallery(): Promise<ProductView[]> {
    const scheme = await this.prisma.schemeEntry.findMany();
    const products = await this.prisma.product.findMany({
      where: { active: true },
      include: { category: true },
    });
    const byKey = new Map(products.map((p) => [`${p.article}::${p.colour}`, p]));

    const items: ProductView[] = [];
    for (const entry of scheme) {
      const product = byKey.get(`${entry.article}::${entry.colour}`);
      if (product) items.push(toView(product));
    }
    return items.sort((a, b) => a.article.localeCompare(b.article));
  }

  async newModelGallery(): Promise<ProductView[]> {
    const newModels = await this.prisma.newModelEntry.findMany();
    const products = await this.prisma.product.findMany({
      where: { active: true },
      include: { category: true },
    });
    const byKey = new Map(products.map((p) => [`${p.article}::${p.colour}`, p]));

    const items: ProductView[] = [];
    for (const entry of newModels) {
      const product = byKey.get(`${entry.article}::${entry.colour}`);
      if (product) items.push(toView(product));
    }
    return items.sort((a, b) => a.article.localeCompare(b.article));
  }

  /** Admin "Search / Check" — full status for one Article + Colour combo. */
  async checkStatus(article: string, colour: string) {
    const a = normalizeArticle(article);
    const c = normalizeColour(colour);

    const [product, inStock, inScheme, isNewModel] = await Promise.all([
      this.prisma.product.findUnique({
        where: { article_colour: { article: a, colour: c } },
        include: { category: true },
      }),
      this.prisma.stockEntry.findFirst({ where: { article: a, colour: c } }),
      this.prisma.schemeEntry.findUnique({ where: { article_colour: { article: a, colour: c } } }),
      this.prisma.newModelEntry.findUnique({ where: { article_colour: { article: a, colour: c } } }),
    ]);

    return {
      article: a,
      colour: c,
      hasPhoto: Boolean(product),
      photoUrl: product?.photoUrl ?? null,
      category: product?.category?.name ?? null,
      inStock: Boolean(inStock),
      inScheme: Boolean(inScheme),
      isNewModel: Boolean(isNewModel),
    };
  }

  /** Bundles the selected product photos into one ZIP for large multi-select downloads. */
  async buildZip(items: ZipItem[]): Promise<Buffer> {
    if (items.length === 0) throw new BadRequestException('No photos selected');
    if (items.length > 300) throw new BadRequestException('Too many photos selected at once');

    const archive = archiver('zip', { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    const output = new PassThrough();
    output.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.pipe(output);

    const usedNames = new Set<string>();
    const uniqueName = (name: string): string => {
      let candidate = name;
      let suffix = 1;
      while (usedNames.has(candidate)) {
        const dot = name.lastIndexOf('.');
        candidate = dot > 0 ? `${name.slice(0, dot)} (${suffix})${name.slice(dot)}` : `${name} (${suffix})`;
        suffix += 1;
      }
      usedNames.add(candidate);
      return candidate;
    };

    await Promise.all(
      items.map(async (item) => {
        try {
          const buffer = item.url.startsWith('/uploads/')
            ? await fs.readFile(path.join(process.cwd(), item.url.replace(/^\//, '')))
            : Buffer.from(await (await fetch(item.url)).arrayBuffer());
          archive.append(buffer, { name: uniqueName(item.name) });
        } catch {
          // skip a photo that failed to load rather than failing the whole ZIP
        }
      }),
    );

    const done = new Promise<Buffer>((resolve, reject) => {
      output.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
    });
    await archive.finalize();
    return done;
  }
}
