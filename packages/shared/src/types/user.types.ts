import type { UserRole } from '../enums';

export interface UserPublicResponse {
  id: string;
  email: string;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  /** ISO 8601 UTC timestamp on the wire. */
  createdAt: string;
  /** ISO 8601 UTC timestamp on the wire. */
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  currentPassword: string;
  newEmail: string;
}

export interface ChangePhoneRequest {
  currentPassword: string;
  newPhoneNumber: string;
}

export interface DeactivateAccountRequest {
  password: string;
}

export interface SetUserActiveRequest {
  isActive: boolean;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  isActive?: boolean;
}
