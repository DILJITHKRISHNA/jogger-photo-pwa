import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeHidden: boolean) {
    return this.prisma.category.findMany({
      where: includeHidden ? undefined : { hidden: false },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name);
    if (!slug) throw new BadRequestException('Category name is required');

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Category "${dto.name}" already exists`);

    const count = await this.prisma.category.count();
    return this.prisma.category.create({
      data: { name: dto.name.trim(), slug, sortOrder: count },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim(), slug: slugify(dto.name) } : {}),
        ...(dto.hidden !== undefined ? { hidden: dto.hidden } : {}),
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    // Product.categoryId is onDelete: SetNull, so products just become
    // uncategorised rather than being deleted.
    await this.prisma.category.delete({ where: { id } });
  }
}
