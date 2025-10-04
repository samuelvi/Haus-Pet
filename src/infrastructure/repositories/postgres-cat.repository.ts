import { Pool, PoolConfig } from "pg";
import { CatRepository } from "../../domain/cat.repository";
import { Cat } from "../../domain/cat";

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'apicat_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
};

export class PostgresCatRepository implements CatRepository {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool(dbConfig);
  }

  public async findAll(): Promise<Cat[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM cat');
      return result.rows.map(row => ({ breed: row.breed }));
    } finally {
      client.release();
    }
  }

  public async findByBreed(breed: string): Promise<Cat | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM cat WHERE breed = $1', [breed]);
      if (result.rows.length === 0) {
        return null;
      }
      return { breed: result.rows[0].breed };
    } finally {
      client.release();
    }
  }

  public async save(cat: Cat): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO cat (breed) VALUES ($1)', [cat.breed]);
    } finally {
      client.release();
    }
  }
}
