import { Pool } from "pg";
import { PetReadRepository } from "../../domain/pet-read.repository";
import { PetWriteRepository } from "../../domain/pet-write.repository";
import { Pet, PetType } from "../../domain/pet";

export class PostgresPetRepository implements PetReadRepository, PetWriteRepository {
  constructor(private readonly pool: Pool) {}

  public async findAll(): Promise<Pet[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT id, breed, type FROM pet');
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async findByBreed(breed: string): Promise<Pet | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT id, breed, type FROM pet WHERE breed = $1', [breed]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  public async findByType(type: PetType): Promise<Pet[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT id, breed, type FROM pet WHERE type = $1', [type]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async save(pet: Pet): Promise<Pet> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO pet (breed, type) VALUES ($1, $2) RETURNING id, breed, type',
        [pet.breed, pet.type]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
