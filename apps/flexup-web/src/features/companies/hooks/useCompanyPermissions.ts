import { CompanyMemberRole } from '@flexup/shared';

interface CompanyPermissions {
  canView: boolean;
  canManage: boolean;
  canOwn: boolean;
}

export function useCompanyPermissions(role: CompanyMemberRole | undefined): CompanyPermissions {
  if (!role) {
    return { canView: false, canManage: false, canOwn: false };
  }
  return {
    canView: true,
    canManage: role === CompanyMemberRole.MANAGER || role === CompanyMemberRole.OWNER,
    canOwn: role === CompanyMemberRole.OWNER,
  };
}
