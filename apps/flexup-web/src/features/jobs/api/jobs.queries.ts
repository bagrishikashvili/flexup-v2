export const jobQueryKeys = {
  all: (companyId: string) => ['companies', companyId, 'job-postings'] as const,
  list: (companyId: string, query = {}) =>
    [...jobQueryKeys.all(companyId), 'list', query] as const,
  detail: (companyId: string, id: string) =>
    [...jobQueryKeys.all(companyId), id] as const,
};
