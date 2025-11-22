import { z } from 'zod';
import { AnimalType } from '../../../domain/breed';

/**
 * Validation schema for creating/updating a breed
 */
export const breedSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Name can only contain letters, numbers, spaces, and hyphens'),
  animalType: z.nativeEnum(AnimalType, {
    errorMap: () => ({ message: `Animal type must be one of: ${Object.values(AnimalType).join(', ')}` }),
  }),
});

/**
 * Validation schema for breed ID parameter
 * Accepts UUIDv7 format
 */
export const breedIdSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
});

export type BreedInput = z.infer<typeof breedSchema>;
export type BreedIdParam = z.infer<typeof breedIdSchema>;
