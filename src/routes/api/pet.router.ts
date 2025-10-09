import { Router } from "express";
import { PetController } from "../../infrastructure/http/controllers/pet.controller";
import { PetService } from "../../application/pet.service";
import { createPetRepository } from "../../infrastructure/repositories/repository.factory";
import { AuditService } from "../../application/audit.service";
import { MongoAuditRepository } from "../../infrastructure/repositories/mongo-audit.repository";
import { AuditLoggingPetServiceDecorator } from "../../application/audit-logging-pet.service.decorator";
import mongoClient from "../../infrastructure/database/mongo-client";
import { QueueService } from "../../infrastructure/queue/queue.service";
import { RedisHealthService } from "../../infrastructure/queue/redis-health.service";
import redisConnection from "../../infrastructure/queue/redis-connection";
import { PetType } from "../../domain/pet";

const router = Router();

// --- Dependency Injection / Composition Root ---

const petRepository = createPetRepository();
const realPetService = new PetService(petRepository, petRepository);
const auditRepository = new MongoAuditRepository(mongoClient);
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
const validatePetType = (req, res, next) => {
  const type = req.params.type;
  if (!Object.values(PetType).includes(type as PetType)) {
    return res.status(400).json({ status: "ERROR", message: `Invalid pet type: '${type}'` });
  }
  next();
};

// --- Generic Routes ---
router.get("/", (req, res) => petController.getAllPets(req, res));
router.get("/random-pet", (req, res) => petController.getRandomPet(req, res));
router.post("/add", (req, res) => petController.addPet(req, res));

// --- Type-Specific Routes ---
router.get("/:type/", validatePetType, (req, res) => petController.getPetsByType(req, res));
router.get("/:type/random-pet", validatePetType, (req, res) => petController.getRandomPetByType(req, res));
router.post("/:type/add", validatePetType, (req, res) => petController.addPetToType(req, res));

export default router;
