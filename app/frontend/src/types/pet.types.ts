export type PetType = 'cat' | 'dog' | 'bird';

export interface Pet {
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
  petId: string;
  userId: string;
  amount: number;
  currency: string;
  createdAt: string;
  pet?: Pet;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateSponsorshipDto {
  petId: string;
  email: string;
  name: string;
  amount: number;
  currency?: string;
}
