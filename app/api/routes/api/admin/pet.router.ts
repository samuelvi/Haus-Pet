import { Router, Request, Response, NextFunction } from 'express';
import { PetController } from '../../../infrastructure/http/controllers/pet.controller';
import { PetService } from '../../../application/pet.service';
import { PostgresEventStoreRepository } from '../../../infrastructure/eventsourcing/postgres-event-store.repository';
import { JwtService } from '../../../infrastructure/auth/services/jwt.service';
import { SessionService } from '../../../infrastructure/auth/services/session.service';
import { createAuthMiddleware } from '../../../infrastructure/http/middleware/auth.middleware';
import prisma from '../../../infrastructure/database/prisma-client';

const router = Router();

// Initialize dependencies
const eventStore = new PostgresEventStoreRepository(prisma);
const petService = new PetService(prisma, eventStore);
const petController = new PetController(petService);

// Auth middleware
const jwtService = new JwtService();
const sessionService = new SessionService();
const authMiddleware = createAuthMiddleware(jwtService, sessionService);

// Role check middleware - only ADMIN can access
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authContext = (req as Request & { authContext?: { role: string } }).authContext;
  if (!authContext || authContext.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

/**
 * Admin routes - Write operations (protected by auth + admin role)
 */

// POST /api/admin/pets - Create new pet
router.post('/', authMiddleware, requireAdmin, petController.create);

// PATCH /api/admin/pets/:id - Update pet
router.patch('/:id', authMiddleware, requireAdmin, petController.update);

// DELETE /api/admin/pets/:id - Delete pet
router.delete('/:id', authMiddleware, requireAdmin, petController.delete);

export default router;
