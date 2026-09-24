import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Res,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelService } from '../excel/excel.service';
import { ImportRunnerService } from '../import-runner/import-runner.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';

@Controller('master')
@Roles(Role.ADMIN)
export class MasterController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excel: ExcelService,
    private readonly runner: ImportRunnerService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  findAll() {
    return this.prisma.masterEntry.findMany({ orderBy: { article: 'asc' } });
  }

  /**
   * Delete the uploaded Master Excel: clears the master list, un-tags every
   * photo (category / brand / gender), and removes the brands and genders that
   * came from it. Categories are kept — they're also managed by hand. Photos
   * themselves are not deleted.
   */
  @Delete()
  async clear(@CurrentUser() user: AuthenticatedUser) {
    const [master, brands, genders] = await this.prisma.$transaction([
      this.prisma.masterEntry.deleteMany({}),
      this.prisma.brand.deleteMany({}),
      this.prisma.gender.deleteMany({}),
      this.prisma.product.updateMany({
        data: { categoryId: null, brandId: null, genderId: null },
      }),
    ]);
    await this.audit.record({
      userId: user.id,
      action: 'master.clear',
      entity: 'MasterEntry',
      meta: { rows: master.count, brands: brands.count, genders: genders.count },
    });
    return { success: true, deleted: master.count };
  }

  @Get('template')
  template(@Res() res: Response) {
    const buffer = this.excel.buildTemplate('master');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="master-template.xlsx"');
    res.send(buffer);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No Excel file was provided');

    const outcome = await this.runner.run('master', file.originalname, file.buffer);
    if (outcome.fatal) throw new UnprocessableEntityException(outcome.fatal);

    await this.audit.record({
      userId: user.id,
      action: 'master.upload',
      entity: 'MasterEntry',
      meta: { filename: file.originalname, success: outcome.record!.success },
    });

    return outcome.record;
  }
}
