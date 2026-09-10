import { Module } from '@nestjs/common';
import { MasterController } from './master.controller';
import { ExcelModule } from '../excel/excel.module';
import { ImportRunnerModule } from '../import-runner/import-runner.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ExcelModule, ImportRunnerModule, AuditModule],
  controllers: [MasterController],
})
export class MasterModule {}
