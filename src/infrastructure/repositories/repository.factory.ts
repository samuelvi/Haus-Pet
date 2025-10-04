import { CatRepository } from "../../domain/cat.repository";
import { InMemoryCatRepository } from "./in-memory-cat.repository";
import { PostgresCatRepository } from "./postgres-cat.repository";

export function createCatRepository(): CatRepository {
  const persistenceType = process.env.PERSISTENCE_TYPE || 'in-memory';

  switch (persistenceType) {
    case 'postgres':
      console.log('Using PostgreSQL persistence.');
      return new PostgresCatRepository();

    case 'in-memory':
      console.log('Using in-memory persistence.');
      return new InMemoryCatRepository();

    default:
      console.warn(`Unknown persistence type "${persistenceType}". Defaulting to in-memory.`);
      return new InMemoryCatRepository();
  }
}
