import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ImportType, Prisma } from '../../generated/prisma/client';

export interface CreateImportRecordInput {
  type: ImportType;
  filename: string;
  total: number;
  success: number;
  errorCount: number;
  errors: unknown[];
  missingPhotos: string[];
}

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateImportRecordInput) {
    return this.prisma.importRecord.create({
      data: {
        type: input.type,
        filename: input.filename,
        total: input.total,
        success: input.success,
        errorCount: input.errorCount,
        errors: input.errors as Prisma.InputJsonValue,
        missingPhotos: input.missingPhotos,
      },
    });
  }

  findAll(type?: ImportType) {
    return this.prisma.importRecord.findMany({
      where: type ? { type } : undefined,
      orderBy: { uploadedAt: 'desc' },
      take: 200,
    });
  }

  async findById(id: string) {
    const record = await this.prisma.importRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Import not found');
    return record;
  }

  async errorsCsv(id: string): Promise<{ csv: string; record: { id: string; type: string } }> {
    const record = await this.findById(id);
    const errors = Array.isArray(record.errors)
      ? (record.errors as Array<{ row: number; article?: string; colour?: string; message: string }>)
      : [];

    const rows = [
      ['Row', 'Article', 'Colour', 'Error'],
      ...errors.map((e) => [String(e.row), e.article ?? '', e.colour ?? '', e.message]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\r\n');

    return { csv, record: { id: record.id, type: record.type } };
  }
}
