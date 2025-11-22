import { z } from 'zod';

export const breedSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  animalType: z.enum(['cat', 'dog', 'bird'], {
    message: 'Please select a valid animal type',
  }),
});

export type BreedFormInputs = z.infer<typeof breedSchema>;
