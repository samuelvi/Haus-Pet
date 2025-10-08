import { Cat } from "./cat";

export interface CatWriteRepository {
  save(cat: Cat): Promise<Cat>;
}
