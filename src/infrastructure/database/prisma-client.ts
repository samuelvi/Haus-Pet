import { PrismaClient } from '@prisma/client';

// It is a best practice to instantiate a single PrismaClient and reuse it across your application.
const prisma = new PrismaClient();

export default prisma;
