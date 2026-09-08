import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtAccessPayload } from '../types/jwt-payload.interface';
import type { AuthenticatedUser } from '../types/authenticated-user.interface';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  /**
   * Re-checks the user on every request (active flag, role, name) rather
   * than trusting a possibly-stale token payload — cheap since it's a
   * primary-key lookup, and it makes deactivating a user effective
   * immediately instead of after their 15-minute token expires.
   */
  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, phone: true, name: true, role: true, active: true },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Account is inactive or no longer exists');
    }

    return { id: user.id, phone: user.phone, name: user.name, role: user.role };
  }
}
