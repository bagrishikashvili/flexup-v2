import type { UserRole } from '../enums';

export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/**
 * @deprecated Use AuthResponseWithoutRefresh.
 * Kept for backward compatibility during migration.
 */
export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

/** refreshToken is NOT returned — it's set as HttpOnly cookie. */
export interface AuthResponseWithoutRefresh {
  accessToken: string;
  user: AuthUserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  role: UserRole.WORKER | UserRole.COMPANY_USER;
}

/** refresh token now comes from HttpOnly cookie */
export interface RefreshRequest {
  // intentionally empty
}
