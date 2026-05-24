import { SetMetadata } from '@nestjs/common';
import { CompanyMemberRole } from '@flexup/shared';

export const COMPANY_ROLES_KEY = 'companyRoles';

export const RequireCompanyRole = (...roles: CompanyMemberRole[]) =>
  SetMetadata(COMPANY_ROLES_KEY, roles);
