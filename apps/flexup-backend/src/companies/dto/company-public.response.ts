import { CompanyMemberRole } from '@flexup/shared';

export class CompanyPublicResponse {
  id: string;
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  defaultCurrency: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  currentUserRole?: CompanyMemberRole;
}
