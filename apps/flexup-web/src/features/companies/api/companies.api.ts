import { apiRequest } from '@/shared/api/client';
import { withRefresh } from '@/shared/api/refresh-interceptor';
import type {
  CompanyPublicResponse,
  CompanyDetailResponse,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from '@flexup/shared';

export async function getMyCompanies(): Promise<CompanyPublicResponse[]> {
  return withRefresh(() => apiRequest<CompanyPublicResponse[]>('/companies/mine'));
}

export async function getCompany(companyId: string): Promise<CompanyDetailResponse> {
  return withRefresh(() => apiRequest<CompanyDetailResponse>(`/companies/${companyId}`));
}

export async function createCompany(payload: CreateCompanyRequest): Promise<CompanyDetailResponse> {
  return withRefresh(() =>
    apiRequest<CompanyDetailResponse>('/companies', {
      method: 'POST',
      body: payload,
    }),
  );
}

export async function updateCompany(
  companyId: string,
  payload: UpdateCompanyRequest,
): Promise<CompanyDetailResponse> {
  return withRefresh(() =>
    apiRequest<CompanyDetailResponse>(`/companies/${companyId}`, {
      method: 'PATCH',
      body: payload,
    }),
  );
}

export async function deactivateCompany(companyId: string): Promise<void> {
  return withRefresh(() =>
    apiRequest<void>(`/companies/${companyId}`, {
      method: 'DELETE',
    }),
  );
}

export async function uploadCompanyLogo(
  companyId: string,
  file: File,
): Promise<CompanyDetailResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return withRefresh(() =>
    apiRequest<CompanyDetailResponse>(`/companies/${companyId}/logo`, {
      method: 'POST',
      body: formData,
    }),
  );
}

export async function removeCompanyLogo(companyId: string): Promise<CompanyDetailResponse> {
  return withRefresh(() =>
    apiRequest<CompanyDetailResponse>(`/companies/${companyId}/logo`, {
      method: 'DELETE',
    }),
  );
}
