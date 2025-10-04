import { CatRepository } from "../../domain/cat.repository";
import { InMemoryCatRepository } from "./in-memory-cat.repository";
import { PostgresCatRepository } from "./postgres-cat.repository";
import { pool } from "../database/postgres-pool";

export function createCatRepository(): CatRepository {
  const persistenceType = process.env.PERSISTENCE_TYPE || 'in-memory';

  switch (persistenceType) {
    case 'postgres':
      console.log('Using PostgreSQL persistence for Cats.');
      return new PostgresCatRepository(pool);

    case 'in-memory':
      console.log('Using in-memory persistence for Cats.');
      return new InMemoryCatRepository();

    default:
      console.warn(`Unknown persistence type "${persistenceType}". Defaulting to in-memory.`);
      return new InMemoryCatRepository();
  }
}
