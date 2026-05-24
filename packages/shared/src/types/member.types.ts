import type { CompanyMemberRole } from '../enums';

export interface MemberUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface MemberResponse {
  id: string;
  userId: string;
  user: MemberUserInfo;
  role: CompanyMemberRole;
  /** ISO 8601 UTC timestamp on the wire. */
  createdAt: string;
}

export interface AddMemberRequest {
  email: string;
  role: CompanyMemberRole;
}

export interface UpdateMemberRoleRequest {
  role: CompanyMemberRole;
}
