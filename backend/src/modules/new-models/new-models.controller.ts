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

@Controller('new-models')
@Roles(Role.ADMIN)
export class NewModelsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excel: ExcelService,
    private readonly runner: ImportRunnerService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  findAll() {
    return this.prisma.newModelEntry.findMany({ orderBy: { article: 'asc' } });
  }

  /** Delete the uploaded list (executives stop seeing it immediately). */
  @Delete()
  async clear(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.prisma.newModelEntry.deleteMany({});
    await this.audit.record({
      userId: user.id,
      action: 'new-model.clear',
      entity: 'NewModelEntry',
      meta: { rows: result.count },
    });
    return { success: true, deleted: result.count };
  }

  @Get('template')
  template(@Res() res: Response) {
    const buffer = this.excel.buildTemplate('new-model');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="new-model-template.xlsx"');
    res.send(buffer);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No Excel file was provided');

    const outcome = await this.runner.run('new-model', file.originalname, file.buffer);
    if (outcome.fatal) throw new UnprocessableEntityException(outcome.fatal);

    await this.audit.record({
      userId: user.id,
      action: 'new-model.upload',
      entity: 'NewModelEntry',
      meta: { filename: file.originalname, success: outcome.record!.success },
    });

    return outcome.record;
  }
}
