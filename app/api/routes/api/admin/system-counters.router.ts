import { Router, Request, Response, NextFunction } from 'express';
import { SystemCountersController } from '../../../infrastructure/http/controllers/system-counters.controller';
import { JwtService } from '../../../infrastructure/auth/services/jwt.service';
import { SessionService } from '../../../infrastructure/auth/services/session.service';
import { createAuthMiddleware } from '../../../infrastructure/http/middleware/auth.middleware';

/**
 * System Counters Router (Admin Only)
 *
 * Provides endpoints for retrieving system metrics/counters.
 */
// Middleware to require ADMIN role
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authContext = (req as Request & { authContext?: { role: string } }).authContext;
  if (!authContext || authContext.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export function createSystemCountersRouter(
  controller: SystemCountersController
): Router {
  const router = Router();

  // Auth middleware
  const jwtService = new JwtService();
  const sessionService = new SessionService();
  const authMiddleware = createAuthMiddleware(jwtService, sessionService);

  /**
   * GET /api/admin/counters
   * Get all system counters
   */
  router.get('/', authMiddleware, requireAdmin, (req, res) => controller.getCounters(req, res));

  /**
   * POST /api/admin/counters/recalculate
   * Recalculate all counters (useful for fixing inconsistencies)
   */
  router.post('/recalculate', authMiddleware, requireAdmin, (req, res) => controller.recalculate(req, res));

  return router;
}
