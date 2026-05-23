import { UserRole } from '@prisma/client';

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
