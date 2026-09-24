import { Module } from '@nestjs/common';
import { ImportRunnerService } from './import-runner.service';
import { ExcelModule } from '../excel/excel.module';
import { ImportsModule } from '../imports/imports.module';
import { AuditModule } from '../audit/audit.module';
import { ImportDeleteController } from './import-delete.controller';

@Module({
  imports: [ExcelModule, ImportsModule, AuditModule],
  controllers: [ImportDeleteController],
  providers: [ImportRunnerService],
  exports: [ImportRunnerService],
})
export class ImportRunnerModule {}
