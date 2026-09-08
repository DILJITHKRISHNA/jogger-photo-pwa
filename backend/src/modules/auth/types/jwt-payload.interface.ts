import { Role } from '../../../generated/prisma/enums';

/** Claims embedded in the access token. */
export interface JwtAccessPayload {
  sub: string; // userId
  phone: string;
  name: string;
  role: Role;
}

/** Claims embedded in the refresh token — deliberately minimal. */
export interface JwtRefreshPayload {
  sub: string; // userId
  // Random per-issuance nonce so two tokens for the same user never
  // collide even when issued within the same iat second — without it,
  // "rotation" would be a no-op for requests that land in the same
  // wall-clock second as the token they're rotating.
  jti?: string;
}
