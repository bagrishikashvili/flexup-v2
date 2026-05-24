import { z } from 'zod';
import { CompanyMemberRole } from '../enums';

const currencyRegex = /^[A-Z]{3}$/;

export const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(200),
  legalName: z.string().trim().max(200).optional(),
  registrationNumber: z.string().trim().max(50).optional(),
  vatNumber: z.string().trim().max(50).optional(),
  websiteUrl: z.string().url().max(500).optional(),
  defaultCurrency: z
    .string()
    .regex(currencyRegex, 'defaultCurrency must be ISO 4217')
    .optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const addMemberSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.nativeEnum(CompanyMemberRole),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(CompanyMemberRole),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
