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

// --- Middleware to validate pet type ---
const validatePetType = (req: Request, res: Response, next: NextFunction) => {
  const type = req.params.type;
  if (!Object.values(PetType).includes(type as PetType)) {
    return res.status(400).json({ status: "ERROR", message: `Invalid pet type: '${type}'` });
  }
  next();
};

// --- Generic Routes ---
router.get("/", (req: Request, res: Response) => petController.getAllPets(req, res));
router.get("/random-pet", (req: Request, res: Response) => petController.getRandomPet(req, res));
router.post("/add", (req: Request, res: Response) => petController.addPet(req, res));

// --- Type-Specific Routes ---
router.get("/:type/", validatePetType, (req: Request, res: Response) => petController.getPetsByType(req, res));
router.get("/:type/random-pet", validatePetType, (req: Request, res: Response) => petController.getRandomPetByType(req, res));
router.post("/:type/add", validatePetType, (req: Request, res: Response) => petController.addPetToType(req, res));

export default router;
