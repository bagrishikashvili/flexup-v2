import { UserRole } from '@flexup/shared';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}
