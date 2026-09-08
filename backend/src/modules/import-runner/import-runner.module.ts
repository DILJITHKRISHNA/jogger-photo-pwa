import { Module } from '@nestjs/common';
import { ImportRunnerService } from './import-runner.service';
import { ExcelModule } from '../excel/excel.module';
import { ImportsModule } from '../imports/imports.module';

@Module({
  imports: [ExcelModule, ImportsModule],
  providers: [ImportRunnerService],
  exports: [ImportRunnerService],
})
export class ImportRunnerModule {}
