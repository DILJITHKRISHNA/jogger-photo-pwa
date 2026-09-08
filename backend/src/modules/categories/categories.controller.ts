import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categories: CategoriesService,
    private readonly audit: AuditService,
  ) {}

  /** Any signed-in user — Bulk Photos needs the visible list, Admin needs everything. */
  @Get()
  findAll(@Query('includeHidden') includeHidden?: string) {
    return this.categories.findAll(includeHidden === 'true');
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    const category = await this.categories.create(dto);
    await this.audit.record({
      userId: user.id,
      action: 'category.create',
      entity: 'Category',
      entityId: category.id,
      meta: { name: category.name },
    });
    return category;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const category = await this.categories.update(id, dto);
    await this.audit.record({
      userId: user.id,
      action: 'category.update',
      entity: 'Category',
      entityId: category.id,
      meta: { name: dto.name, hidden: dto.hidden },
    });
    return category;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.categories.remove(id);
    await this.audit.record({
      userId: user.id,
      action: 'category.delete',
      entity: 'Category',
      entityId: id,
    });
    return { success: true };
  }
}
