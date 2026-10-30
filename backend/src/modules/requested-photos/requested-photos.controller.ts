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

@Controller('requested-photos')
@Roles(Role.ADMIN)
export class RequestedPhotosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excel: ExcelService,
    private readonly runner: ImportRunnerService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  findAll() {
    return this.prisma.requestedEntry.findMany({ orderBy: { article: 'asc' } });
  }

  /** Clear the list and its upload history (executives stop seeing it immediately). */
  @Delete()
  async clear(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.prisma.requestedEntry.deleteMany({});
    await this.prisma.importRecord.deleteMany({ where: { type: 'REQUESTED' } });
    await this.audit.record({
      userId: user.id,
      action: 'requested.clear',
      entity: 'RequestedEntry',
      meta: { rows: result.count },
    });
    return { success: true, deleted: result.count };
  }

  @Get('template')
  template(@Res() res: Response) {
    const buffer = this.excel.buildTemplate('requested');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="requested-photos-template.xlsx"',
    );
    res.send(buffer);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No Excel file was provided');

    const outcome = await this.runner.run(
      'requested',
      file.originalname,
      file.buffer,
    );
    if (outcome.fatal) throw new UnprocessableEntityException(outcome.fatal);

    await this.audit.record({
      userId: user.id,
      action: 'requested.upload',
      entity: 'RequestedEntry',
      meta: { filename: file.originalname, success: outcome.record!.success },
    });

    return outcome.record;
  }
}
