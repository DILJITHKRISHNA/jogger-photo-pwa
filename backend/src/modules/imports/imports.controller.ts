import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ImportsService } from './imports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import type { ImportType } from '../../generated/prisma/client';

@Controller('imports')
@Roles(Role.ADMIN)
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Get()
  findAll(@Query('type') type?: ImportType) {
    return this.imports.findAll(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imports.findById(id);
  }

  @Get(':id/errors')
  async errorsCsv(@Param('id') id: string, @Res() res: Response) {
    const { csv, record } = await this.imports.errorsCsv(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${record.type.toLowerCase()}-import-errors-${record.id}.csv"`,
    );
    res.send(csv);
  }
}
