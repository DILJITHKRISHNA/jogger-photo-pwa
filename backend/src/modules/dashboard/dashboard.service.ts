import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

const CACHE_KEY = 'dashboard:stats';
const CACHE_TTL_SECONDS = 10;

export interface DashboardStats {
  photosCount: number;
  activeArticleCount: number;
  categoriesCount: number;
  stockArticleCount: number;
  schemeCount: number;
  newModelCount: number;
  missingStockPhotoCount: number;
  lastPhotoUpdate: string | null;
  lastStockUpload: string | null;
  lastSchemeUpload: string | null;
  lastNewModelUpload: string | null;
  recentImportErrorCount: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const cached = await this.redis.get<DashboardStats>(CACHE_KEY);
    if (cached) return cached;

    const [
      products,
      categoriesCount,
      stock,
      schemeCount,
      newModelCount,
      latestPhoto,
      latestStock,
      latestScheme,
      latestNewModel,
      recentImports,
    ] = await Promise.all([
      this.prisma.product.findMany({ where: { active: true }, select: { article: true } }),
      this.prisma.category.count({ where: { hidden: false } }),
      this.prisma.stockEntry.findMany({ select: { article: true, colour: true } }),
      this.prisma.schemeEntry.count(),
      this.prisma.newModelEntry.count(),
      this.prisma.product.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      this.prisma.stockEntry.findFirst({ orderBy: { stockDate: 'desc' }, select: { stockDate: true } }),
      this.prisma.importRecord.findFirst({
        where: { type: 'SCHEME' },
        orderBy: { uploadedAt: 'desc' },
        select: { uploadedAt: true },
      }),
      this.prisma.importRecord.findFirst({
        where: { type: 'NEW_MODEL' },
        orderBy: { uploadedAt: 'desc' },
        select: { uploadedAt: true },
      }),
      this.prisma.importRecord.findMany({
        orderBy: { uploadedAt: 'desc' },
        take: 10,
        select: { errorCount: true },
      }),
    ]);

    const photoKeys = new Set(products.map((p) => p.article));
    const missingStockPhotoCount = await this.prisma.$transaction(async (tx) => {
      const allProducts = await tx.product.findMany({
        where: { active: true },
        select: { article: true, colour: true },
      });
      const set = new Set(allProducts.map((p) => `${p.article}::${p.colour}`));
      const stockRows = await tx.stockEntry.findMany({ select: { article: true, colour: true } });
      return stockRows.filter((s) => !set.has(`${s.article}::${s.colour}`)).length;
    });

    const stats: DashboardStats = {
      photosCount: products.length,
      activeArticleCount: photoKeys.size,
      categoriesCount,
      stockArticleCount: stock.length,
      schemeCount,
      newModelCount,
      missingStockPhotoCount,
      lastPhotoUpdate: latestPhoto?.updatedAt.toISOString() ?? null,
      lastStockUpload: latestStock?.stockDate.toISOString() ?? null,
      lastSchemeUpload: latestScheme?.uploadedAt.toISOString() ?? null,
      lastNewModelUpload: latestNewModel?.uploadedAt.toISOString() ?? null,
      recentImportErrorCount: recentImports.reduce((sum, i) => sum + i.errorCount, 0),
    };

    await this.redis.set(CACHE_KEY, stats, CACHE_TTL_SECONDS);
    return stats;
  }
}
