export type PetType = 'cat' | 'dog' | 'bird';

export interface Animal {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  photoUrl: string;
  totalSponsored: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sponsorship {
  id: string;
  animalId: string;
  userId: string;
  amount: number;
  currency: string;
  createdAt: string;
  animal?: Animal;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateSponsorshipDto {
  animalId: string;
  email: string;
  name: string;
  amount: number;
  currency?: string;
}
