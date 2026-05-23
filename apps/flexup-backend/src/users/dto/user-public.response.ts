import { UserRole } from '@prisma/client';

export class UserPublicResponse {
  id: string;
  email: string;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
