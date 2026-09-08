import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import type { JwtAccessPayload, JwtRefreshPayload } from './types/jwt-payload.interface';
import type { User } from '../../generated/prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  name: string;
  phone: string;
  role: User['role'];
}

function toSafeUser(user: User): SafeUser {
  return { id: user.id, name: user.name, phone: user.phone, role: user.role };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  /** POST /auth/login — phone + password → access + refresh token. */
  async login(phone: string, password: string): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.users.findByPhone(phone);

    // Same error whether the phone doesn't exist or the password is wrong —
    // never let the response reveal which one it was.
    const passwordOk = user ? await this.users.verifyPassword(password, user.passwordHash) : false;

    if (!user || !passwordOk) {
      await this.audit.record({ action: 'auth.login.failed', entity: 'Auth', meta: { phone } });
      throw new UnauthorizedException('Invalid phone or password');
    }

    if (!user.active) {
      await this.audit.record({
        userId: user.id,
        action: 'auth.login.blocked',
        entity: 'Auth',
        entityId: user.id,
      });
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.issueTokens(user);
    await this.users.setRefreshTokenHash(user.id, tokens.refreshToken);
    await this.audit.record({
      userId: user.id,
      action: 'auth.login',
      entity: 'Auth',
      entityId: user.id,
    });

    return { user: toSafeUser(user), tokens };
  }

  /**
   * POST /auth/refresh — validates the presented refresh token against the
   * stored hash, then rotates it (old token is invalidated even if it
   * hadn't expired yet).
   */
  async refresh(
    payload: JwtRefreshPayload,
    presentedRefreshToken: string,
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.users.findById(payload.sub);
    const tokenOk = user
      ? this.users.verifyRefreshToken(presentedRefreshToken, user.hashedRefreshToken)
      : false;

    if (!user || !tokenOk || !user.active) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.issueTokens(user);
    await this.users.setRefreshTokenHash(user.id, tokens.refreshToken);
    await this.audit.record({
      userId: user.id,
      action: 'auth.refresh',
      entity: 'Auth',
      entityId: user.id,
    });

    return { user: toSafeUser(user), tokens };
  }

  /** POST /auth/logout — revokes the refresh token server-side. */
  async logout(userId: string): Promise<void> {
    await this.users.setRefreshTokenHash(userId, null);
    await this.audit.record({
      userId,
      action: 'auth.logout',
      entity: 'Auth',
      entityId: userId,
    });
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    };
    const refreshPayload: JwtRefreshPayload = { sub: user.id, jti: randomUUID() };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') as StringValue,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
