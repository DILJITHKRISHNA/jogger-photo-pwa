import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { StorageModule } from '../storage/storage.module';
import { ImportsModule } from '../imports/imports.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [StorageModule, ImportsModule, AuditModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
