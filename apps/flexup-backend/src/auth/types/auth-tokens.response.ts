import { UserRole } from '@flexup/shared';

export interface UserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
}

/** refreshToken is NOT returned — it's set as HttpOnly cookie. */
export interface AuthResponseWithoutRefresh {
  accessToken: string;
  user: UserPublic;
}
