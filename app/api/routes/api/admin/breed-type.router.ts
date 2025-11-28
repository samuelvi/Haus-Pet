import { Router, Request, Response, NextFunction } from "express";
import { container } from "../../../infrastructure/di/container";
import { TYPES } from "../../../infrastructure/di/types";
import { BreedTypeController } from "../../../infrastructure/http/controllers/breed-type.controller";
import { JwtService } from "../../../infrastructure/auth/services/jwt.service";
import { SessionService } from "../../../infrastructure/auth/services/session.service";
import { createAuthMiddleware } from "../../../infrastructure/http/middleware/auth.middleware";

const router = Router();

// --- Dependency Injection via Container ---
const breedTypeController = container.get<BreedTypeController>(TYPES.BreedTypeController);

// Auth middleware
const jwtService = new JwtService();
const sessionService = new SessionService();
const authMiddleware = createAuthMiddleware(jwtService, sessionService);

// Role check middleware - only ADMIN can access
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authContext = (req as Request & { authContext?: { role: string } }).authContext;
  if (!authContext || authContext.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

// List
router.get("/", authMiddleware, requireAdmin, breedTypeController.list);
// Create
router.post("/", authMiddleware, requireAdmin, breedTypeController.create);
// Update
router.patch("/:id", authMiddleware, requireAdmin, breedTypeController.update);
// Delete
router.delete("/:id", authMiddleware, requireAdmin, breedTypeController.delete);

export default router;
