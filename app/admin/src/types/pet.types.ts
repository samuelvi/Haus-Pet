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

export interface CreatePetDto {
  name: string;
  type: PetType;
  breed: string;
  photoUrl?: string;
}

export interface UpdatePetDto {
  name?: string;
  type?: PetType;
  breed?: string;
  photoUrl?: string;
}
