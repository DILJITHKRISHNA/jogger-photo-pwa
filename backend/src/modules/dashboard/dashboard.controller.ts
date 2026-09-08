import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';

@Controller('dashboard')
@Roles(Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getStats() {
    return this.dashboard.getStats();
  }
}
