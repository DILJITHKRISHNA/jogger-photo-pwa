import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ShareLinksService, sharedPhotoFilename } from './share-links.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { productShareJpeg } from '../../common/util/share-photo';

/** Content-Disposition value that survives spaces and non-ASCII article names. */
function attachment(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/**
 * "Share as link": an executive turns a selection into one link, and the
 * customer opens it without signing in. Creating a link needs a signed-in
 * user; everything else is public but only reachable with the link's
 * unguessable token, and only ever exposes that link's photos (share-sized
 * JPEGs + article/colour — no stock or pricing data).
 */
@Controller('share-links')
export class ShareLinksController {
  constructor(
    private readonly shareLinks: ShareLinksService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateShareLinkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const link = await this.shareLinks.create(dto.productIds, user.id);
    await this.audit.record({
      userId: user.id,
      action: 'share-link.create',
      entity: 'ShareLink',
      entityId: link.id,
      meta: { photos: link.productIds.length },
    });
    return {
      token: link.token,
      count: link.productIds.length,
      expiresAt: link.expiresAt,
    };
  }

  @Get(':token')
  @Public()
  view(@Param('token') token: string) {
    return this.shareLinks.view(token);
  }

  /**
   * One photo of the link. Not rate-limited: the customer's page loads every
   * photo on it at once.
   */
  @Get(':token/photos/:productId')
  @Public()
  @SkipThrottle()
  async photo(
    @Param('token') token: string,
    @Param('productId') productId: string,
    @Query('download') download: string | undefined,
    @Res() res: Response,
  ) {
    const link = await this.shareLinks.findActive(token);
    const product = await this.shareLinks.product(link, productId);
    const jpeg = await productShareJpeg(product);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    if (download)
      res.setHeader(
        'Content-Disposition',
        attachment(sharedPhotoFilename(product)),
      );
    res.send(jpeg);
  }
}
