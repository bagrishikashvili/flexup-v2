import { User } from '@prisma/client';
import { UserPublicResponse } from '@/users/dto/user-public.response';

export function toUserPublic(user: User): UserPublicResponse {
  return {
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
