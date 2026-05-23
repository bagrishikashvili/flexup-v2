import { CompanyPublicResponse } from '@/companies/dto/company-public.response';

export class CompanyDetailResponse extends CompanyPublicResponse {
  registrationNumber: string | null;
  vatNumber: string | null;
  memberCount: number;
  verifiedAt: Date | null;
}
