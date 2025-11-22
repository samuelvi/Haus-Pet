import { BreedReadRepository } from "../../domain/breed-read.repository";
import { BreedWriteRepository } from "../../domain/breed-write.repository";
import { InMemoryBreedRepository } from "./in-memory-breed.repository";
import { PostgresBreedRepository } from "./postgres-breed.repository";
import prisma from "../database/prisma-client"; // Changed from postgres-pool

// The factory now returns an object that satisfies both read and write contracts.
export function createBreedRepository(): BreedReadRepository & BreedWriteRepository {
  const persistenceType = process.env.PERSISTENCE_TYPE || 'in-memory';

  switch (persistenceType) {
    case 'postgres':
      console.log('Using PostgreSQL persistence for Breeds with Prisma.'); // Updated log message
      return new PostgresBreedRepository(prisma); // Changed from pool

    case 'in-memory':
      console.log('Using in-memory persistence for Breeds.');
      return new InMemoryBreedRepository();

    default:
      console.warn(`Unknown persistence type "${persistenceType}". Defaulting to in-memory.`);
      return new InMemoryBreedRepository();
  }
}
