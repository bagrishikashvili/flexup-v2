import type { UserRole } from '../enums';

export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
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

export interface RefreshRequest {
  refreshToken: string;
}
