export enum PetType {
  Cat = 'cat',
  Dog = 'dog',
  Bird = 'bird',
}

export interface Pet {
  id?: string;
  breed: string;
  type: PetType;
}
