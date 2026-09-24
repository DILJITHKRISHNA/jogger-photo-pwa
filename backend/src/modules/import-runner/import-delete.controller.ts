import { Controller, Delete, Param } from '@nestjs/common';
import { ImportRunnerService } from './import-runner.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';

@Controller('imports')
@Roles(Role.ADMIN)
export class ImportDeleteController {
  constructor(
    private readonly runner: ImportRunnerService,
    private readonly audit: AuditService,
  ) {}

  /** Delete one upload (and the data it added — see ImportRunnerService.deleteImport). */
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.runner.deleteImport(id);
    await this.audit.record({
      userId: user.id,
      action: 'import.delete',
      entity: 'ImportRecord',
      entityId: id,
      meta: result,
    });
    return { success: true, ...result };
  }
}
