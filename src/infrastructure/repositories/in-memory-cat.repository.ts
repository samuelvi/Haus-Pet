import { CatRepository } from "../../domain/cat.repository";
import { Cat } from "../../domain/cat";

export class InMemoryCatRepository implements CatRepository {
  private readonly cats: Cat[] = [
    { breed: "Siamese" },
    { breed: "Persian" },
    { breed: "Maine Coon" },
    { breed: "Ragdoll" },
    { breed: "Bengal" },
    { breed: "Sphynx" },
    { breed: "British Shorthair" },
    { breed: "Abyssinian" },
    { breed: "Scottish Fold" },
    { breed: "Birman" },
  ];

  public async findAll(): Promise<Cat[]> {
    return this.cats;
  }
}
