import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as not requiring a JWT. The global JwtAuthGuard checks for
 * this metadata and skips authentication when present (e.g. login, refresh,
 * and the executive-facing read endpoints — see catalogue.controller.ts).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
