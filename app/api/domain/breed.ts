export enum PetType {
  Cat = 'cat',
  Dog = 'dog',
  Bird = 'bird',
}

export interface Breed {
  id?: string;
  name: string;
  petType: PetType;
}
