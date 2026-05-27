export interface JobSectionResponse {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}

export interface JobCategoryResponse {
  id: string;
  sectionId: string;
  section?: JobSectionResponse;
  slug: string;
  title: string;
  titleKa: string;
  isExperienceRequired: boolean;
  isTippable: boolean;
  minimumEarningsPerHourMinor: number;
  currency: string;
  sortOrder: number;
}

export interface SkillResponse {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}

export interface AppearanceResponse {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}

export interface LanguageResponse {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}
