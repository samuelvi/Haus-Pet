import { Router, Request, Response, NextFunction } from "express";
import { PetController } from "../../infrastructure/http/controllers/pet.controller";
import { PetService } from "../../application/pet.service";
import { createPetRepository } from "../../infrastructure/repositories/repository.factory";
import { AuditService } from "../../application/audit.service";
import { MongoAuditRepository } from "../../infrastructure/repositories/mongo-audit.repository";
import { AuditLoggingPetServiceDecorator } from "../../application/audit-logging-pet.service.decorator";
import { QueueService } from "../../infrastructure/queue/queue.service";
import { RedisHealthService } from "../../infrastructure/queue/redis-health.service";
import redisConnection from "../../infrastructure/queue/redis-connection";
import { PetType } from "../../domain/pet";
import { JwtService } from "../../infrastructure/auth/services/jwt.service";
import { SessionService } from "../../infrastructure/auth/services/session.service";
import { createAuthMiddleware } from "../../infrastructure/http/middleware/auth.middleware";

const router = Router();

// --- Dependency Injection / Composition Root ---

const petRepository = createPetRepository();
const realPetService = new PetService(petRepository, petRepository);
// The MongoAuditRepository no longer needs a client passed to its constructor.
const auditRepository = new MongoAuditRepository();
const auditService = new AuditService(auditRepository);
const queueService = new QueueService();
const redisHealthService = new RedisHealthService(redisConnection);
const decoratedPetService = new AuditLoggingPetServiceDecorator(
  realPetService,
  auditService,
  queueService,
  redisHealthService
);
const petController = new PetController(decoratedPetService);

// Authentication middleware
const jwtService = new JwtService();
const sessionService = new SessionService();
const authMiddleware = createAuthMiddleware(jwtService, sessionService);

// --- Middleware to validate pet type ---
const validatePetType = (req: Request, res: Response, next: NextFunction) => {
  const type = req.params.type;
  if (!Object.values(PetType).includes(type as PetType)) {
    return res.status(400).json({ status: "ERROR", message: `Invalid pet type: '${type}'` });
  }
  next();
};

// --- Middleware to validate pet ID ---
const validatePetId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const numId = Number(id);

  // Check if it's not a number or is not a positive integer
  if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({ status: "ERROR", message: "Invalid pet ID" });
  }

  next();
};

// --- Generic Routes ---
// GET routes are PUBLIC (read-only access for everyone)
router.get("/", (req: Request, res: Response) => petController.getAllPets(req, res));
router.get("/random-pet", (req: Request, res: Response) => petController.getRandomPet(req, res));

// POST routes are PROTECTED (admin only)
router.post("/add", authMiddleware, (req: Request, res: Response) => petController.addPet(req, res));

// --- Type-Specific Routes (MUST come before /:id to avoid conflicts) ---
// GET routes are PUBLIC
router.get("/:type/random-pet", validatePetType, (req: Request, res: Response) => petController.getRandomPetByType(req, res));

// POST routes are PROTECTED
router.post("/:type/add", authMiddleware, validatePetType, (req: Request, res: Response) => petController.addPetToType(req, res));

// --- ID-Based Routes (MUST come last due to /:id param) ---
// GET by type or ID: if it's a valid type, handle as type; otherwise validate as ID
router.get("/:idOrType", (req: Request, res: Response, next: NextFunction) => {
  const param = req.params.idOrType;

  // Check if it's a valid pet type
  if (Object.values(PetType).includes(param as PetType)) {
    // Remap parameter for controller
    req.params.type = param;
    return petController.getPetsByType(req, res);
  }

  // Otherwise, validate as ID
  const numId = Number(param);
  if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({ status: "ERROR", message: "Invalid pet ID" });
  }

  // Remap parameter for controller
  req.params.id = param;
  return petController.getPetById(req, res);
});

// PUT/DELETE routes are PROTECTED (admin only)
router.put("/:id", authMiddleware, validatePetId, (req: Request, res: Response) => petController.updatePet(req, res));
router.delete("/:id", authMiddleware, validatePetId, (req: Request, res: Response) => petController.deletePet(req, res));

export default router;
