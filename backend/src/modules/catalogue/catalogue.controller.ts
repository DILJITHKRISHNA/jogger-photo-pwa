import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CatalogueService, type ZipItem } from './catalogue.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { sharePhotoJpeg } from '../../common/util/share-photo';

/**
 * The executive-facing "read" API — every route here is available to any
 * signed-in user (ADMIN or EXECUTIVE); only /check is admin-only. No
 * stock quantity, pricing or other confidential data is ever included in
 * these responses.
 */
@Controller('catalogue')
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  /**
   * Share-sized JPEG of a stored photo (max 1280 px), used by the share
   * button so even full-size camera originals share quickly and within the
   * browser's share limits. Not rate-limited: one share batch fetches up to
   * 100 of these at once.
   */
  @Get('share-photo/:name')
  @SkipThrottle()
  async sharePhoto(@Param('name') name: string, @Res() res: Response) {
    const jpeg = await sharePhotoJpeg(name);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.send(jpeg);
  }

  @Get('search')
  search(@Query('article') article: string) {
    return this.catalogue.searchByArticle(article ?? '');
  }

  @Get('suggest')
  suggest(@Query('q') q: string) {
    return this.catalogue.suggestArticles(q ?? '');
  }

  @Get('product')
  getByKey(@Query('article') article: string, @Query('colour') colour: string) {
    return this.catalogue.getByKey(article ?? '', colour ?? '');
  }

  @Get('categories/:slug')
  categoryGallery(@Param('slug') slug: string) {
    return this.catalogue.categoryGallery(slug);
  }

  @Get('brands')
  brands() {
    return this.catalogue.brands();
  }

  @Get('brands/:slug')
  brandGallery(@Param('slug') slug: string) {
    return this.catalogue.brandGallery(slug);
  }

  @Get('genders')
  genders() {
    return this.catalogue.genders();
  }

  @Get('genders/:slug')
  genderGallery(@Param('slug') slug: string) {
    return this.catalogue.genderGallery(slug);
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
