import { Pool, PoolConfig } from "pg";

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'hauspet_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  // Opciones adicionales para un pool robusto
  max: 20, // Número máximo de clientes en el pool
  idleTimeoutMillis: 30000, // Tiempo que un cliente puede estar inactivo
  connectionTimeoutMillis: 2000, // Tiempo para esperar una conexión
};

// Exportamos una única instancia del pool para toda la aplicación
export const pool = new Pool(dbConfig);
