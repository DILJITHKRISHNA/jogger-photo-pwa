import { Module } from '@nestjs/common';
import { SchemeController } from './scheme.controller';
import { ExcelModule } from '../excel/excel.module';
import { ImportRunnerModule } from '../import-runner/import-runner.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ExcelModule, ImportRunnerModule, AuditModule],
  controllers: [SchemeController],
})
export class SchemeModule {}
