import { z } from 'zod';

const countryRegex = /^[A-Z]{2}$/;

export const createLocationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(100),
  country: z
    .string()
    .regex(countryRegex, 'country must be ISO 3166-1 alpha-2')
    .optional(),
  postalCode: z.string().trim().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type SetActiveInput = z.infer<typeof setActiveSchema>;
