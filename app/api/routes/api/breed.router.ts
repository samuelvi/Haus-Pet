import { Router, Request, Response, NextFunction } from "express";
import { BreedController } from "../../infrastructure/http/controllers/breed.controller";
import { BreedService } from "../../application/breed.service";
import { createBreedRepository } from "../../infrastructure/repositories/repository.factory";
import { AuditService } from "../../application/audit.service";
import { MongoAuditRepository } from "../../infrastructure/repositories/mongo-audit.repository";
import { AuditLoggingBreedServiceDecorator } from "../../application/audit-logging-breed.service.decorator";
import { QueueService } from "../../infrastructure/queue/queue.service";
import { RedisHealthService } from "../../infrastructure/queue/redis-health.service";
import redisConnection from "../../infrastructure/queue/redis-connection";
import { AnimalType } from "../../domain/breed";
import { JwtService } from "../../infrastructure/auth/services/jwt.service";
import { SessionService } from "../../infrastructure/auth/services/session.service";
import { createAuthMiddleware } from "../../infrastructure/http/middleware/auth.middleware";

const router = Router();

// --- Dependency Injection / Composition Root ---

const breedRepository = createBreedRepository();
const realBreedService = new BreedService(breedRepository, breedRepository);
// The MongoAuditRepository no longer needs a client passed to its constructor.
const auditRepository = new MongoAuditRepository();
const auditService = new AuditService(auditRepository);
const queueService = new QueueService();
const redisHealthService = new RedisHealthService(redisConnection);
const decoratedBreedService = new AuditLoggingBreedServiceDecorator(
  realBreedService,
  auditService,
  queueService,
  redisHealthService
);
const breedController = new BreedController(decoratedBreedService);

// Authentication middleware
const jwtService = new JwtService();
const sessionService = new SessionService();
const authMiddleware = createAuthMiddleware(jwtService, sessionService);

// --- Middleware to validate animal type ---
const validateAnimalType = (req: Request, res: Response, next: NextFunction) => {
  const type = req.params.type;
  if (!Object.values(AnimalType).includes(type as AnimalType)) {
    return res.status(400).json({ status: "ERROR", message: `Invalid animal type: '${type}'` });
  }
  next();
};

// --- Middleware to validate breed ID (UUID) ---
const validateBreedId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;

  // UUID regex pattern (UUIDv4/v7 format)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ status: "ERROR", message: "Invalid breed ID: must be a valid UUID" });
  }

  next();
};

// --- Generic Routes ---
// GET routes are PUBLIC (read-only access for everyone)
router.get("/", (req: Request, res: Response) => breedController.getAllBreeds(req, res));
router.get("/random-breed", (req: Request, res: Response) => breedController.getRandomBreed(req, res));

// POST routes are PROTECTED (admin only)
router.post("/add", authMiddleware, (req: Request, res: Response) => breedController.addBreed(req, res));

// --- Type-Specific Routes (MUST come before /:id to avoid conflicts) ---
// GET routes are PUBLIC
router.get("/:type/random-breed", validateAnimalType, (req: Request, res: Response) => breedController.getRandomBreedByType(req, res));

// POST routes are PROTECTED
router.post("/:type/add", authMiddleware, validateAnimalType, (req: Request, res: Response) => breedController.addBreedToType(req, res));

// --- ID-Based Routes (MUST come last due to /:id param) ---
// GET by type or ID: if it's a valid type, handle as type; otherwise validate as ID
router.get("/:idOrType", (req: Request, res: Response, next: NextFunction) => {
  const param = req.params.idOrType;

  // Check if it's a valid animal type
  if (Object.values(AnimalType).includes(param as AnimalType)) {
    // Remap parameter for controller
    req.params.type = param;
    return breedController.getBreedsByType(req, res);
  }

  // Otherwise, validate as UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(param)) {
    return res.status(400).json({ status: "ERROR", message: "Invalid breed ID: must be a valid UUID" });
  }

  // Remap parameter for controller
  req.params.id = param;
  return breedController.getBreedById(req, res);
});

// PUT/DELETE routes are PROTECTED (admin only)
router.put("/:id", authMiddleware, validateBreedId, (req: Request, res: Response) => breedController.updateBreed(req, res));
router.delete("/:id", authMiddleware, validateBreedId, (req: Request, res: Response) => breedController.deleteBreed(req, res));

export default router;
