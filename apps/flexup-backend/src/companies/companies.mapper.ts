import { Company } from '@prisma/client';
import { CompanyMemberRole } from '@flexup/shared';
import { CompanyPublicResponse } from '@/companies/dto/company-public.response';
import { CompanyDetailResponse } from '@/companies/dto/company-detail.response';

export function toCompanyPublic(
  company: Company,
  currentUserRole?: CompanyMemberRole,
): CompanyPublicResponse {
  return {
    id: company.id,
    name: company.name,
    legalName: company.legalName ?? null,
    logoUrl: company.logoUrl ?? null,
    websiteUrl: company.websiteUrl ?? null,
    defaultCurrency: company.defaultCurrency,
    isVerified: company.isVerified,
    isActive: company.isActive,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
    ...(currentUserRole !== undefined && { currentUserRole }),
  };
}

export function toCompanyDetail(
  company: Company,
  memberCount: number,
  currentUserRole?: CompanyMemberRole,
): CompanyDetailResponse {
  return {
    ...toCompanyPublic(company, currentUserRole),
    registrationNumber: company.registrationNumber ?? null,
    vatNumber: company.vatNumber ?? null,
    memberCount,
    verifiedAt: company.verifiedAt ?? null,
  };
}
