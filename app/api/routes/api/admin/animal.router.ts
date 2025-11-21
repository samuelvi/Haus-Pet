import { Router, Request, Response, NextFunction } from 'express';
import { AnimalController } from '../../../infrastructure/http/controllers/animal.controller';
import { AnimalService } from '../../../application/animal.service';
import { PostgresEventStoreRepository } from '../../../infrastructure/eventsourcing/postgres-event-store.repository';
import { JwtService } from '../../../infrastructure/auth/services/jwt.service';
import { SessionService } from '../../../infrastructure/auth/services/session.service';
import { createAuthMiddleware } from '../../../infrastructure/http/middleware/auth.middleware';
import prisma from '../../../infrastructure/database/prisma-client';

const router = Router();

// Initialize dependencies
const eventStore = new PostgresEventStoreRepository(prisma);
const animalService = new AnimalService(prisma, eventStore);
const animalController = new AnimalController(animalService);

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

// POST /api/admin/animals - Create new animal
router.post('/', authMiddleware, requireAdmin, animalController.create);

// PATCH /api/admin/animals/:id - Update animal
router.patch('/:id', authMiddleware, requireAdmin, animalController.update);

// DELETE /api/admin/animals/:id - Delete animal
router.delete('/:id', authMiddleware, requireAdmin, animalController.delete);

export default router;
