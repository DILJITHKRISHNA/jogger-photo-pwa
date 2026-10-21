import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Product, ShareLink } from '../../generated/prisma/client';

/** How long a share link keeps working after it's sent. */
const LINK_LIFETIME_DAYS = 7;
/** Expired links are kept this long (so they can say "expired"), then deleted. */
const EXPIRED_RETENTION_DAYS = 30;
export const MAX_PHOTOS_PER_LINK = 1000;
/** 16 url-safe characters (96 random bits) — impossible to guess. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SharedPhoto {
  id: string;
  article: string;
  colour: string;
}

@Injectable()
export class ShareLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(productIds: string[], userId: string): Promise<ShareLink> {
    const unique = [...new Set(productIds)];
    const found = await this.prisma.product.findMany({
      where: { id: { in: unique }, active: true },
      select: { id: true },
    });
    const valid = new Set(found.map((p) => p.id));
    const ordered = unique.filter((id) => valid.has(id));
    if (ordered.length === 0)
      throw new BadRequestException('None of those photos exist any more');

    // Housekeeping: drop links that expired long ago.
    await this.prisma.shareLink.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(Date.now() - EXPIRED_RETENTION_DAYS * DAY_MS),
        },
      },
    });

    return this.prisma.shareLink.create({
      data: {
        token: randomBytes(12).toString('base64url'),
        productIds: ordered,
        createdById: userId,
        expiresAt: new Date(Date.now() + LINK_LIFETIME_DAYS * DAY_MS),
      },
    });
  }

  /** The link behind `token` — 404 if it never existed, 410 once it has expired. */
  async findActive(token: string): Promise<ShareLink> {
    if (!TOKEN_PATTERN.test(token))
      throw new NotFoundException('This link is not valid');
    const link = await this.prisma.shareLink.findUnique({ where: { token } });
    if (!link) throw new NotFoundException('This link is not valid');
    if (link.expiresAt.getTime() < Date.now())
      throw new GoneException('This link has expired');
    return link;
  }

  /** The link's products that still exist, in the order they were shared. */
  async products(link: ShareLink): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: link.productIds }, active: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return link.productIds.flatMap((id) => byId.get(id) ?? []);
  }

  /** One of the link's products — never a product the link doesn't include. */
  async product(link: ShareLink, productId: string): Promise<Product> {
    if (!link.productIds.includes(productId))
      throw new NotFoundException('Photo not found');
    const product = await this.prisma.product.findFirst({
      where: { id: productId, active: true },
    });
    if (!product) throw new NotFoundException('Photo not found');
    return product;
  }

  /** What the link's public page shows — article + colour only, nothing confidential. */
  async view(
    token: string,
  ): Promise<{ expiresAt: Date; photos: SharedPhoto[] }> {
    const link = await this.findActive(token);
    const products = await this.products(link);
    return {
      expiresAt: link.expiresAt,
      photos: products.map((p) => ({
        id: p.id,
        article: p.article,
        colour: p.colour,
      })),
    };
  }
}

/** "JM1267 BRWN.jpg" — safe as a download / ZIP entry name. */
export function sharedPhotoFilename(
  product: Pick<Product, 'article' | 'colour'>,
): string {
  return (
    `${product.article} ${product.colour}`
      .replace(/[\\/:*?"<>|\p{Cc}]+/gu, '-')
      .trim() + '.jpg'
  );
}
