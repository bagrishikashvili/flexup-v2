import type {
  JobCategoryResponse,
  SkillResponse,
  AppearanceResponse,
  LanguageResponse,
} from './reference-data.types';

export interface JobPostingResponse {
  id: string;
  companyId: string;
  category: JobCategoryResponse;
  createdById: string;

  title: string;
  briefing: string;
  coverPhotoUrl: string | null;

  addressLine: string;
  city: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;

  contactPersonName: string;
  contactPersonPhone: string;

  isArchived: boolean;
  archivedAt: string | null;

  skills: SkillResponse[];
  appearances: AppearanceResponse[];
  languages: LanguageResponse[];

  createdAt: string;
  updatedAt: string;
}

export interface JobPostingListItemResponse {
  id: string;
  companyId: string;
  title: string;
  categoryTitle: string;
  categoryTitleKa: string;
  city: string;
  coverPhotoUrl: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface CreateJobPostingRequest {
  categoryId: string;
  title: string;
  briefing: string;

  addressLine: string;
  city: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;

  contactPersonName: string;
  contactPersonPhone: string;

  skillIds: string[];
  appearanceIds: string[];
  languageIds: string[];
}

export type UpdateJobPostingRequest = Partial<CreateJobPostingRequest>;

export interface SetArchivedRequest {
  isArchived: boolean;
}

export interface JobPostingListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  city?: string;
  isArchived?: boolean;
}
