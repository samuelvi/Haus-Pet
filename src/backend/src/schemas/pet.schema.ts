import { z } from 'zod';

export const petSchema = z.object({
  breed: z
    .string()
    .min(1, 'Breed is required')
    .min(2, 'Breed must be at least 2 characters')
    .max(50, 'Breed must not exceed 50 characters'),
  type: z.enum(['cat', 'dog', 'bird'], {
    message: 'Please select a valid pet type',
  }),
});

export type PetFormInputs = z.infer<typeof petSchema>;
