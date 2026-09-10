import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { ImportsService } from '../imports/imports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';

@Controller('products')
@Roles(Role.ADMIN)
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly imports: ImportsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    return this.products.findAll(categoryId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.products.remove(id);
    await this.audit.record({
      userId: user.id,
      action: 'product.delete',
      entity: 'Product',
      entityId: id,
    });
    return { success: true };
  }

  @Post('photos')
  @UseInterceptors(FilesInterceptor('files', 200, { limits: { fileSize: 15 * 1024 * 1024 } }))
  async uploadPhotos(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No photos were selected');
    }

    const { uploaded, errors } = await this.products.uploadPhotos(files);

    const uncategorised = uploaded.filter((u) => u.uncategorised);
    const record = await this.imports.create({
      type: 'PHOTOS',
      filename: files.length === 1 ? files[0].originalname : `${files.length} photos`,
      total: files.length,
      success: uploaded.length,
      errorCount: errors.length,
      errors,
      missingPhotos: uncategorised.map((u) => `${u.article} ${u.colour}`),
    });

    await this.audit.record({
      userId: user.id,
      action: 'photos.upload',
      entity: 'Product',
      meta: { total: files.length, success: uploaded.length, errorCount: errors.length },
    });

    return {
      importId: record.id,
      total: files.length,
      success: uploaded.length,
      newCount: uploaded.filter((u) => !u.replaced).length,
      replacedCount: uploaded.filter((u) => u.replaced).length,
      errorCount: errors.length,
      errors,
      uploaded,
      uncategorisedCount: uncategorised.length,
    };
  }
}
