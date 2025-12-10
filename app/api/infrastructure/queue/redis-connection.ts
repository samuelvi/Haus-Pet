import IORedis from "ioredis";

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  connectTimeout: 5000, // 5 seconds timeout for connection
  commandTimeout: 5000, // 5 seconds timeout for commands
  maxRetriesPerRequest: 3, // Limit retries to prevent infinite loops
  retryStrategy: (times) => {
    // Retry up to 3 times with exponential backoff (max 500ms)
    if (times > 3) return null;
    return Math.min(times * 50, 500);
  },
  lazyConnect: false, // Connect immediately to fail fast if Redis unavailable
});

export default connection;
