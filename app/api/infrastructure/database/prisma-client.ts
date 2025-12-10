import { PrismaClient } from '@prisma/client';

// It is a best practice to instantiate a single PrismaClient and reuse it across your application.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Handle connection errors gracefully
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
  // Don't exit immediately - let the app try to reconnect on first query
});

export default prisma;
