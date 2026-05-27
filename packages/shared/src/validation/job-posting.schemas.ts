import { z } from 'zod';

const coordPairRefinement = (data: { latitude?: number; longitude?: number }) =>
  (data.latitude !== undefined) === (data.longitude !== undefined);

const jobPostingBaseSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(3).max(200).trim(),
  briefing: z.string().min(10).max(7500),

  addressLine: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  country: z.string().length(2).optional().default('GE'),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  contactPersonName: z.string().min(1).max(200),
  contactPersonPhone: z.string().min(5).max(50),

  skillIds: z.array(z.string()).max(20).default([]),
  appearanceIds: z.array(z.string()).max(15).default([]),
  languageIds: z.array(z.string()).max(5).default([]),
});

export const createJobPostingSchema = jobPostingBaseSchema.refine(
  coordPairRefinement,
  { message: 'latitude and longitude must be provided together' },
);

export const updateJobPostingSchema = jobPostingBaseSchema
  .partial()
  .refine(coordPairRefinement, {
    message: 'latitude and longitude must be provided together',
  });

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;
