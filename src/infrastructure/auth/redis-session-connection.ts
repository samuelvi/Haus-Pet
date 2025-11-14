import IORedis from "ioredis";

/**
 * Redis connection specifically for session management.
 * Uses database 1 to separate from BullMQ queue data (database 0).
 */
const sessionConnection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  db: 1, // Database 1 for sessions (BullMQ uses default db:0)
  maxRetriesPerRequest: null,
});

export default sessionConnection;
