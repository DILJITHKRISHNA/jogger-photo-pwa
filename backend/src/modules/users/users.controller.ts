import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../generated/prisma/enums';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';

/** Admin management of the user-side (EXECUTIVE) logins. */
@Controller('users')
@Roles(Role.ADMIN)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  findAll() {
    return this.users.listExecutives();
  }

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser() admin: AuthenticatedUser) {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException('A user with this email already exists');
    }
    const user = await this.users.create({
      name: dto.name || dto.email.split('@')[0],
      email: dto.email,
      password: dto.password,
      role: Role.EXECUTIVE,
    });
    await this.audit.record({
      userId: admin.id,
      action: 'user.create',
      entity: 'User',
      entityId: user.id,
      meta: { email: user.email },
    });
    return this.users.toListItem(user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const existing = await this.users.findById(id);
    // Only user-side accounts are managed here — admins can't be locked out from this screen.
    if (!existing || existing.role !== Role.EXECUTIVE) {
      throw new NotFoundException('User not found');
    }
    const user = await this.users.updateExecutive(id, dto);
    await this.audit.record({
      userId: admin.id,
      action: 'user.update',
      entity: 'User',
      entityId: id,
      meta: {
        email: user.email,
        active: dto.active,
        passwordReset: dto.password !== undefined,
      },
    });
    return this.users.toListItem(user);
  }
}
