import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CatalogueService, type ZipItem } from './catalogue.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';

/**
 * The executive-facing "read" API — every route here is available to any
 * signed-in user (ADMIN or EXECUTIVE); only /check is admin-only. No
 * stock quantity, pricing or other confidential data is ever included in
 * these responses.
 */
@Controller('catalogue')
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get('search')
  search(@Query('article') article: string) {
    return this.catalogue.searchByArticle(article ?? '');
  }

  @Get('product')
  getByKey(@Query('article') article: string, @Query('colour') colour: string) {
    return this.catalogue.getByKey(article ?? '', colour ?? '');
  }

  @Get('categories/:slug')
  categoryGallery(@Param('slug') slug: string) {
    return this.catalogue.categoryGallery(slug);
  }

  @Get('stock')
  stockGallery() {
    return this.catalogue.stockGallery();
  }

  @Get('scheme')
  schemeGallery() {
    return this.catalogue.schemeGallery();
  }

  @Get('new-models')
  newModelGallery() {
    return this.catalogue.newModelGallery();
  }

  @Get('check')
  @Roles(Role.ADMIN)
  check(@Query('article') article: string, @Query('colour') colour: string) {
    return this.catalogue.checkStatus(article ?? '', colour ?? '');
  }

  @Post('zip')
  @HttpCode(HttpStatus.OK)
  async zip(
    @Body('items') items: ZipItem[],
    @Body('zipName') zipName: string | undefined,
    @Res() res: Response,
  ) {
    const buffer = await this.catalogue.buildZip(items ?? []);
    const safeName = (zipName || 'jogger-photos').replace(/[^a-z0-9-_]+/gi, '-');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.zip"`);
    res.send(buffer);
  }
}
