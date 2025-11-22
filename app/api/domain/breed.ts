export enum AnimalType {
  Cat = 'cat',
  Dog = 'dog',
  Bird = 'bird',
}

export interface Breed {
  id?: string;
  name: string;
  animalType: AnimalType;
}
