import { CompanyMemberRole } from '@flexup/shared';

export class MemberResponse {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  role: CompanyMemberRole;
  createdAt: Date;
}
