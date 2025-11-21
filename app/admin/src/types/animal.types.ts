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

export interface CreateAnimalDto {
  name: string;
  type: PetType;
  breed: string;
  photoUrl?: string;
}

export interface UpdateAnimalDto {
  name?: string;
  type?: PetType;
  breed?: string;
  photoUrl?: string;
}
