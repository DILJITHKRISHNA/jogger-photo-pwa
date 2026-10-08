import { Role } from '../../../generated/prisma/enums';

/** Shape attached to `request.user` after a request passes JwtAuthGuard. */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string;
  role: Role;
}
