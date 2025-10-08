import { Pool } from "pg";
import { CatReadRepository } from "../../domain/cat-read.repository";
import { CatWriteRepository } from "../../domain/cat-write.repository";
import { Cat } from "../../domain/cat";

export class PostgresCatRepository implements CatReadRepository, CatWriteRepository {
  constructor(private readonly pool: Pool) {}

  public async findAll(): Promise<Cat[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT id, breed FROM cat');
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async findByBreed(breed: string): Promise<Cat | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT id, breed FROM cat WHERE breed = $1', [breed]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  public async save(cat: Cat): Promise<Cat> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO cat (breed) VALUES ($1) RETURNING id, breed',
        [cat.breed]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
