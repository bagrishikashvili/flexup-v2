import { apiRequest } from '@/shared/api/client';
import { withRefresh } from '@/shared/api/refresh-interceptor';
import type {
  JobPostingResponse,
  JobPostingListItemResponse,
  CreateJobPostingRequest,
  UpdateJobPostingRequest,
  SetArchivedRequest,
  PaginatedResponse,
} from '@flexup/shared';

export interface JobListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  city?: string;
  isArchived?: boolean;
}

export async function getJobPostings(
  companyId: string,
  query: JobListQuery = {},
): Promise<PaginatedResponse<JobPostingListItemResponse>> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.city) params.set('city', query.city);
  if (query.isArchived !== undefined) params.set('isArchived', String(query.isArchived));
  const qs = params.toString();
  return apiRequest<PaginatedResponse<JobPostingListItemResponse>>(
    `/companies/${companyId}/job-postings${qs ? `?${qs}` : ''}`,
  );
}

export async function getJobPosting(
  companyId: string,
  id: string,
): Promise<JobPostingResponse> {
  return apiRequest<JobPostingResponse>(`/companies/${companyId}/job-postings/${id}`);
}

export async function createJobPosting(
  companyId: string,
  payload: CreateJobPostingRequest,
): Promise<JobPostingResponse> {
  return withRefresh(() =>
    apiRequest<JobPostingResponse>(`/companies/${companyId}/job-postings`, {
      method: 'POST',
      body: payload,
    }),
  );
}

export async function updateJobPosting(
  companyId: string,
  id: string,
  payload: UpdateJobPostingRequest,
): Promise<JobPostingResponse> {
  return withRefresh(() =>
    apiRequest<JobPostingResponse>(`/companies/${companyId}/job-postings/${id}`, {
      method: 'PATCH',
      body: payload,
    }),
  );
}

export async function setJobPostingArchived(
  companyId: string,
  id: string,
  payload: SetArchivedRequest,
): Promise<JobPostingResponse> {
  return withRefresh(() =>
    apiRequest<JobPostingResponse>(`/companies/${companyId}/job-postings/${id}/archive`, {
      method: 'PATCH',
      body: payload,
    }),
  );
}

export async function deleteJobPosting(
  companyId: string,
  id: string,
): Promise<void> {
  return withRefresh(() =>
    apiRequest<void>(`/companies/${companyId}/job-postings/${id}`, {
      method: 'DELETE',
    }),
  );
}

export async function uploadJobCoverPhoto(
  companyId: string,
  id: string,
  file: File,
): Promise<JobPostingResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return withRefresh(() =>
    apiRequest<JobPostingResponse>(`/companies/${companyId}/job-postings/${id}/cover-photo`, {
      method: 'POST',
      body: formData,
    }),
  );
}

export async function removeJobCoverPhoto(
  companyId: string,
  id: string,
): Promise<JobPostingResponse> {
  return withRefresh(() =>
    apiRequest<JobPostingResponse>(`/companies/${companyId}/job-postings/${id}/cover-photo`, {
      method: 'DELETE',
    }),
  );
}
