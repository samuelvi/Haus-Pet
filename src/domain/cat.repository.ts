import { Cat } from "./cat";

export interface CatRepository {
  findAll(): Promise<Cat[]>;
}
