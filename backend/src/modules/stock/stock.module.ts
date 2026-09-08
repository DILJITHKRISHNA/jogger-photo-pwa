import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { ExcelModule } from '../excel/excel.module';
import { ImportRunnerModule } from '../import-runner/import-runner.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ExcelModule, ImportRunnerModule, AuditModule],
  controllers: [StockController],
})
export class StockModule {}
