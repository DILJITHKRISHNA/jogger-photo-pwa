import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../generated/prisma/enums';

const SALT_ROUNDS = 12;

/**
 * Refresh tokens are hashed with SHA-256, not bcrypt — bcrypt silently
 * truncates its input at 72 bytes, and a signed JWT refresh token is
 * longer than that with a large shared prefix across tokens for the same
 * user, which would make bcrypt hash any of them the same way and defeat
 * rotation entirely. SHA-256 has no such limit; the token itself already
 * has enough entropy that a slow salted hash buys nothing here (unlike a
 * user-chosen password, which still uses bcrypt below).
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function tokensMatch(presented: string, storedHashHex: string): boolean {
  const presentedHash = Buffer.from(hashToken(presented), 'hex');
  const storedHash = Buffer.from(storedHashHex, 'hex');
  return (
    presentedHash.length === storedHash.length && timingSafeEqual(presentedHash, storedHash)
  );
}

export interface CreateUserInput {
  name: string;
  phone: string;
  password: string;
  role?: Role;
}

/** Backs auth (password hashing/verification, refresh-token rotation) and the seed script. */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async create(input: CreateUserInput) {
    const passwordHash = await this.hashPassword(input.password);
    return this.prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash,
        role: input.role ?? Role.EXECUTIVE,
      },
    });
  }

  verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }

  /** Stores a hash of the refresh token, never the raw token. */
  async setRefreshTokenHash(userId: string, refreshToken: string | null) {
    const hashedRefreshToken = refreshToken ? hashToken(refreshToken) : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  verifyRefreshToken(refreshToken: string, hash: string | null): boolean {
    if (!hash) return false;
    return tokensMatch(refreshToken, hash);
  }
}
