import { CompanyMember, User } from '@prisma/client';
import { MemberResponse } from '@/company-members/dto/member.response';

type MemberWithUser = CompanyMember & { user: User };

export function toMemberResponse(member: MemberWithUser): MemberResponse {
  return {
    id: member.id,
    userId: member.userId,
    user: {
      id: member.user.id,
      email: member.user.email,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      avatarUrl: member.user.avatarUrl ?? null,
    },
    role: member.role,
    createdAt: member.createdAt,
  };
}
