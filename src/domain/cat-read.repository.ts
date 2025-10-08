import { Cat } from "./cat";

export interface CatReadRepository {
  findAll(): Promise<Cat[]>;
  findByBreed(breed: string): Promise<Cat | null>;
}
