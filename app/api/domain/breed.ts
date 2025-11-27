export type PetType = string;

export interface BreedType {
  id?: string;
  name: string;
}

export interface Breed {
  id?: string;
  name: string;
  petType: PetType;
  breedTypeId: string;
}
