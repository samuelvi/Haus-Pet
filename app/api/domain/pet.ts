export enum PetType {
  Cat = 'cat',
  Dog = 'dog',
  Bird = 'bird',
}

export interface Pet {
  id?: number;
  breed: string;
  type: PetType;
}
