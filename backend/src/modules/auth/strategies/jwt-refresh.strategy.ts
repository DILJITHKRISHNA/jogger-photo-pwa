import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import type { JwtRefreshPayload } from '../types/jwt-payload.interface';

export const REFRESH_COOKIE_NAME = 'refresh_token';

function extractRefreshToken(req: Request): string | null {
  const fromCookie = (req.cookies?.[REFRESH_COOKIE_NAME] as string) ?? null;
  if (fromCookie) return fromCookie;
  const body = req.body as Record<string, unknown> | undefined;
  const fromBody = body?.refreshToken;
  return typeof fromBody === 'string' ? fromBody : null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractRefreshToken,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload): JwtRefreshPayload & { refreshToken: string } {
    const token = extractRefreshToken(req);
    if (!token) throw new UnauthorizedException('Missing refresh token');
    // Raw token is attached alongside the payload so AuthService can verify
    // it against the stored hash and rotate it.
    return { ...payload, refreshToken: token };
  }
}
