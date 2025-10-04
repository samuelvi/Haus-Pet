import { Cat } from "./cat";

export interface CatRepository {
  findAll(): Promise<Cat[]>;
  findByBreed(breed: string): Promise<Cat | null>;
  save(cat: Cat): Promise<Cat>; // Ahora devuelve el gato guardado
}
