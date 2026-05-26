export const companyQueryKeys = {
  all: ['companies'] as const,
  mine: () => [...companyQueryKeys.all, 'mine'] as const,
  detail: (companyId: string) => [...companyQueryKeys.all, 'detail', companyId] as const,
};
