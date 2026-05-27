import { Prisma } from '@prisma/client';
import {
  JobPostingResponse,
  JobPostingListItemResponse,
  JobCategoryResponse,
  SkillResponse,
  AppearanceResponse,
  LanguageResponse,
} from '@flexup/shared';

type JobPostingWithIncludes = Prisma.JobPostingGetPayload<{
  include: {
    category: { include: { section: true } };
    skills: { include: { skill: true } };
    appearances: { include: { appearance: true } };
    languages: { include: { language: true } };
  };
}>;

type JobPostingWithCategory = Prisma.JobPostingGetPayload<{
  include: { category: true };
}>;

function toJobCategoryResponse(
  cat: Prisma.JobCategoryGetPayload<{ include: { section: true } }>,
): JobCategoryResponse {
  return {
    id: cat.id,
    sectionId: cat.sectionId,
    section: {
      id: cat.section.id,
      slug: cat.section.slug,
      name: cat.section.name,
      nameKa: cat.section.nameKa,
      sortOrder: cat.section.sortOrder,
    },
    slug: cat.slug,
    title: cat.title,
    titleKa: cat.titleKa,
    isExperienceRequired: cat.isExperienceRequired,
    isTippable: cat.isTippable,
    minimumEarningsPerHourMinor: cat.minimumEarningsPerHourMinor,
    currency: cat.currency,
    sortOrder: cat.sortOrder,
  };
}

function toSkillResponse(skill: {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}): SkillResponse {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    nameKa: skill.nameKa,
    sortOrder: skill.sortOrder,
  };
}

function toAppearanceResponse(appearance: {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}): AppearanceResponse {
  return {
    id: appearance.id,
    slug: appearance.slug,
    name: appearance.name,
    nameKa: appearance.nameKa,
    sortOrder: appearance.sortOrder,
  };
}

function toLanguageResponse(language: {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}): LanguageResponse {
  return {
    id: language.id,
    slug: language.slug,
    name: language.name,
    nameKa: language.nameKa,
    sortOrder: language.sortOrder,
  };
}

export function toJobPostingResponse(
  job: JobPostingWithIncludes,
): JobPostingResponse {
  return {
    id: job.id,
    companyId: job.companyId,
    category: toJobCategoryResponse(job.category),
    createdById: job.createdById,
    title: job.title,
    briefing: job.briefing,
    coverPhotoUrl: job.coverPhotoUrl ?? null,
    addressLine: job.addressLine,
    city: job.city,
    country: job.country,
    postalCode: job.postalCode ?? null,
    latitude: job.latitude ?? null,
    longitude: job.longitude ?? null,
    contactPersonName: job.contactPersonName,
    contactPersonPhone: job.contactPersonPhone,
    isArchived: job.isArchived,
    archivedAt: job.archivedAt?.toISOString() ?? null,
    skills: job.skills.map((s) => toSkillResponse(s.skill)),
    appearances: job.appearances.map((a) => toAppearanceResponse(a.appearance)),
    languages: job.languages.map((l) => toLanguageResponse(l.language)),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export function toJobPostingListItem(
  job: JobPostingWithCategory,
): JobPostingListItemResponse {
  return {
    id: job.id,
    companyId: job.companyId,
    title: job.title,
    categoryTitle: job.category.title,
    categoryTitleKa: job.category.titleKa,
    city: job.city,
    coverPhotoUrl: job.coverPhotoUrl ?? null,
    isArchived: job.isArchived,
    createdAt: job.createdAt.toISOString(),
  };
}

export const jobPostingFullInclude = {
  category: { include: { section: true } },
  skills: { include: { skill: true } },
  appearances: { include: { appearance: true } },
  languages: { include: { language: true } },
} as const;
