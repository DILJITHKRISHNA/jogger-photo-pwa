import { Module } from '@nestjs/common';
import { ShareLinksController } from './share-links.controller';
import { ShareLinksService } from './share-links.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ShareLinksController],
  providers: [ShareLinksService],
})
export class ShareLinksModule {}
