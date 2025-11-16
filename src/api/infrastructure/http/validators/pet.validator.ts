import { z } from 'zod';
import { PetType } from '../../../domain/pet';

/**
 * Validation schema for creating/updating a pet
 */
export const petSchema = z.object({
  breed: z
    .string({ required_error: 'Breed is required' })
    .trim()
    .min(2, 'Breed must be at least 2 characters long')
    .max(50, 'Breed must not exceed 50 characters')
    .regex(/^[a-zA-Z\s-]+$/, 'Breed can only contain letters, spaces, and hyphens'),
  type: z.nativeEnum(PetType, {
    errorMap: () => ({ message: `Type must be one of: ${Object.values(PetType).join(', ')}` }),
  }),
});

/**
 * Validation schema for pet ID parameter
 */
export const petIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer').transform(Number),
});

export type PetInput = z.infer<typeof petSchema>;
export type PetIdParam = z.infer<typeof petIdSchema>;
