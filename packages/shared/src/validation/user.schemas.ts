import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const changeEmailSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().email().toLowerCase().trim(),
});

export const changePhoneSchema = z.object({
  currentPassword: z.string().min(1),
  newPhoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be E.164 format'),
});

export const deactivateAccountSchema = z.object({
  password: z.string().min(1),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ChangePhoneInput = z.infer<typeof changePhoneSchema>;
export type DeactivateAccountInput = z.infer<typeof deactivateAccountSchema>;
