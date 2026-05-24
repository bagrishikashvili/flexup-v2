import type { CompanyMemberRole } from '../enums';

export interface CompanyPublicResponse {
  id: string;
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  defaultCurrency: string;
  isVerified: boolean;
  isActive: boolean;
  /** ISO 8601 UTC timestamp on the wire. */
  createdAt: string;
  /** ISO 8601 UTC timestamp on the wire. */
  updatedAt: string;
  currentUserRole?: CompanyMemberRole;
}

export interface CompanyDetailResponse extends CompanyPublicResponse {
  registrationNumber: string | null;
  vatNumber: string | null;
  memberCount: number;
  /** ISO 8601 UTC timestamp on the wire. */
  verifiedAt: string | null;
}

export interface CreateCompanyRequest {
  name: string;
  legalName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  websiteUrl?: string;
  defaultCurrency?: string;
}

export type UpdateCompanyRequest = Partial<CreateCompanyRequest>;

export interface CompanyListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
}
