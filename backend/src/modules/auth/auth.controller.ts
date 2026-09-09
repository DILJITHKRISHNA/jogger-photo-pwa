import { Body, Controller, HttpCode, HttpStatus, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { REFRESH_COOKIE_NAME } from './strategies/jwt-refresh.strategy';
import type { AuthenticatedUser } from './types/authenticated-user.interface';
import type { JwtRefreshPayload } from './types/jwt-payload.interface';

const DAY_MS = 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, refreshToken: string) {
    const apiPrefix = this.config.get<string>('API_PREFIX');
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'none',
      path: `/${apiPrefix}/auth`,
      maxAge: 30 * DAY_MS,
    });
  }

  private clearRefreshCookie(res: Response) {
    const apiPrefix = this.config.get<string>('API_PREFIX');
    res.clearCookie(REFRESH_COOKIE_NAME, { path: `/${apiPrefix}/auth` });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.login(dto.phone, dto.password);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request & { user: JwtRefreshPayload & { refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.refresh({ sub: req.user.sub }, req.user.refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(user.id);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  /** Convenience endpoint for the web app to bootstrap session state. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }
}
