import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type {
  JobSectionResponse,
  JobCategoryResponse,
  SkillResponse,
  AppearanceResponse,
  LanguageResponse,
} from '@flexup/shared';

export function useSections() {
  return useQuery({
    queryKey: ['reference', 'sections'],
    queryFn: () => apiRequest<JobSectionResponse[]>('/reference/sections'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories(sectionId?: string) {
  return useQuery({
    queryKey: ['reference', 'categories', sectionId],
    queryFn: () =>
      apiRequest<JobCategoryResponse[]>(
        `/reference/categories${sectionId ? `?sectionId=${sectionId}` : ''}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSkills() {
  return useQuery({
    queryKey: ['reference', 'skills'],
    queryFn: () => apiRequest<SkillResponse[]>('/reference/skills'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAppearances() {
  return useQuery({
    queryKey: ['reference', 'appearances'],
    queryFn: () => apiRequest<AppearanceResponse[]>('/reference/appearances'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: ['reference', 'languages'],
    queryFn: () => apiRequest<LanguageResponse[]>('/reference/languages'),
    staleTime: 5 * 60 * 1000,
  });
}
