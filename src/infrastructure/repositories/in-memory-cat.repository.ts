import { CatRepository } from "../../domain/cat.repository";
import { Cat } from "../../domain/cat";

export class InMemoryCatRepository implements CatRepository {
  private cats: Cat[] = [
    { id: 1, breed: "Siamese" },
    { id: 2, breed: "Persian" },
    { id: 3, breed: "Maine Coon" },
    { id: 4, breed: "Ragdoll" },
    { id: 5, breed: "Bengal" },
    { id: 6, breed: "Sphynx" },
    { id: 7, breed: "British Shorthair" },
    { id: 8, breed: "Abyssinian" },
    { id: 9, breed: "Scottish Fold" },
    { id: 10, breed: "Birman" },
  ];
  private nextId = 11;

  public async findAll(): Promise<Cat[]> {
    return this.cats;
  }

  public async findByBreed(breed: string): Promise<Cat | null> {
    const foundCat = this.cats.find((cat) => cat.breed.toLowerCase() === breed.toLowerCase());
    return foundCat || null;
  }

  public async save(cat: Cat): Promise<Cat> {
    const newCatWithId = { ...cat, id: this.nextId++ };
    this.cats.push(newCatWithId);
    return newCatWithId;
  }
}
