import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { normalizeArticle, normalizeColour } from '../../common/util/product-key';
import { fileSafeKey, parsePhotoFilename } from '../../common/util/parse-photo-filename';

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
   * Uploading again for the same Article+Colour replaces the old photo.
   */
  async uploadPhotos(files: PhotoUploadFile[], categoryId: string | null) {
    const errors: { row: number; message: string; article?: string; colour?: string }[] = [];
    const uploaded: { article: string; colour: string; photoUrl: string; replaced: boolean }[] = [];

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

        await this.prisma.product.upsert({
          where: { article_colour: { article: parsed.article, colour: parsed.colour } },
          create: {
            article: parsed.article,
            colour: parsed.colour,
            categoryId,
            photoUrl: url,
            photoFilename: parsed.original,
          },
          update: {
            categoryId: categoryId ?? undefined,
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
