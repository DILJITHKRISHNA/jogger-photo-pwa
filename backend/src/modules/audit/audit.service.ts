import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

export interface RecordAuditLogInput {
  userId?: string | null;
  action: string; // e.g. "auth.login", "category.create"
  entity: string; // e.g. "Auth", "Category", "Product"
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
}

/**
 * Every mutating admin action writes an AuditLog row — who, what, when.
 * Failures to write an audit row are logged but never block the request:
 * losing an audit entry is bad, but it must not be the reason a request
 * fails for the user.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          meta: input.meta,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to write audit log for action="${input.action}"`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
