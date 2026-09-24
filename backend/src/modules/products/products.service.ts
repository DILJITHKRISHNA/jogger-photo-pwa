import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { normalizeArticle, normalizeColour } from '../../common/util/product-key';
import { fileSafeKey, parsePhotoFilename } from '../../common/util/parse-photo-filename';
import { slugify } from '../categories/categories.service';

export interface PhotoUploadFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  findAll(categoryId?: string) {
    return this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true },
      orderBy: { article: 'asc' },
    });
  }

  findByKey(article: string, colour: string) {
    return this.prisma.product.findFirst({
      where: { article: normalizeArticle(article), colour: normalizeColour(colour) },
      include: { category: true },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    await this.storage.deletePhoto(product.photoUrl);
    await this.prisma.product.delete({ where: { id } });
  }

  /**
   * Bulk photo upload — filenames must be "ARTICLE COLOUR.jpg" so Article +
   * Colour are read straight from the name; nothing is typed per photo.
   * Category is taken from the Master Excel (Article + Colour), not the upload.
   * Uploading again for the same Article+Colour replaces the old photo.
   */
  async uploadPhotos(files: PhotoUploadFile[]) {
    const errors: { row: number; message: string; article?: string; colour?: string }[] = [];
    const uploaded: {
      article: string;
      colour: string;
      photoUrl: string;
      replaced: boolean;
      uncategorised: boolean;
    }[] = [];

    const [masterRows, categories, brands, genders] = await Promise.all([
      this.prisma.masterEntry.findMany(),
      this.prisma.category.findMany({ select: { id: true, slug: true } }),
      this.prisma.brand.findMany({ select: { id: true, slug: true } }),
      this.prisma.gender.findMany({ select: { id: true, slug: true } }),
    ]);
    const hasMaster = masterRows.length > 0;
    const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
    const brandIdBySlug = new Map(brands.map((b) => [b.slug, b.id]));
    const genderIdBySlug = new Map(genders.map((g) => [g.slug, g.id]));
    const tagsByKey = new Map<
      string,
      { categoryId: string | null; brandId: string | null; genderId: string | null }
    >();
    for (const row of masterRows) {
      tagsByKey.set(`${row.article}::${row.colour}`, {
        categoryId: categoryIdBySlug.get(slugify(row.category)) ?? null,
        brandId: row.brand ? (brandIdBySlug.get(slugify(row.brand)) ?? null) : null,
        genderId: row.gender ? (genderIdBySlug.get(slugify(row.gender)) ?? null) : null,
      });
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const parsed = parsePhotoFilename(file.originalname);

      if (!parsed.ok) {
        errors.push({ row: i + 1, message: `${parsed.original}: ${parsed.reason}` });
        continue;
      }

      try {
        const existing = await this.prisma.product.findUnique({
          where: { article_colour: { article: parsed.article, colour: parsed.colour } },
        });

        const key = fileSafeKey(parsed.article, parsed.colour);
        const { url } = await this.storage.uploadPhoto({
          key,
          ext: parsed.ext,
          buffer: file.buffer,
          contentType: file.mimetype || CONTENT_TYPES[parsed.ext] || 'application/octet-stream',
        });

        const tags = hasMaster
          ? (tagsByKey.get(`${parsed.article}::${parsed.colour}`) ?? {
              categoryId: null,
              brandId: null,
              genderId: null,
            })
          : {
              categoryId: existing?.categoryId ?? null,
              brandId: existing?.brandId ?? null,
              genderId: existing?.genderId ?? null,
            };
        const { categoryId } = tags;

        await this.prisma.product.upsert({
          where: { article_colour: { article: parsed.article, colour: parsed.colour } },
          create: {
            article: parsed.article,
            colour: parsed.colour,
            ...tags,
            photoUrl: url,
            photoFilename: parsed.original,
          },
          update: {
            ...tags,
            photoUrl: url,
            photoFilename: parsed.original,
            active: true,
          },
        });

        uploaded.push({
          article: parsed.article,
          colour: parsed.colour,
          photoUrl: url,
          replaced: Boolean(existing),
          uncategorised: !categoryId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        errors.push({
          row: i + 1,
          message: `${parsed.original}: ${message}`,
          article: parsed.article,
          colour: parsed.colour,
        });
      }
    }

    return { uploaded, errors };
  }
}
