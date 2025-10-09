import { PetReadRepository } from "../../domain/pet-read.repository";
import { PetWriteRepository } from "../../domain/pet-write.repository";
import { InMemoryPetRepository } from "./in-memory-pet.repository";
import { PostgresPetRepository } from "./postgres-pet.repository";
import { pool } from "../database/postgres-pool";

// The factory now returns an object that satisfies both read and write contracts.
export function createPetRepository(): PetReadRepository & PetWriteRepository {
  const persistenceType = process.env.PERSISTENCE_TYPE || 'in-memory';

  switch (persistenceType) {
    case 'postgres':
      console.log('Using PostgreSQL persistence for Pets.');
      return new PostgresPetRepository(pool);

    case 'in-memory':
      console.log('Using in-memory persistence for Pets.');
      return new InMemoryPetRepository();

    default:
      console.warn(`Unknown persistence type "${persistenceType}". Defaulting to in-memory.`);
      return new InMemoryPetRepository();
  }
}
