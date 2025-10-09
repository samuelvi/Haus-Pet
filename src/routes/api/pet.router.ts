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

const router = Router();

// --- Dependency Injection / Composition Root ---

// 1. Create Pet repository (implements both read and write interfaces)
const petRepository = createPetRepository();

// 2. Inject the repository for both read and write operations into the service
const realPetService = new PetService(petRepository, petRepository);

// 3. Create Audit infrastructure
const auditRepository = new MongoAuditRepository(mongoClient);
const auditService = new AuditService(auditRepository);

// 4. Create Queue and Health Check infrastructure
const queueService = new QueueService();
const redisHealthService = new RedisHealthService(redisConnection);

// 5. Decorate the real PetService with auditing functionality
const decoratedPetService = new AuditLoggingPetServiceDecorator(
  realPetService,
  auditService,
  queueService,
  redisHealthService
);

// 6. Inject the fully decorated service into the controller
const petController = new PetController(decoratedPetService);

// --- Define the routes ---
router.get(
  "/", // GET /api/pets/
  (req, res) => petController.getAllPets(req, res)
);

router.get(
  "/random-pet", // GET /api/pets/random-pet
  (req, res) => petController.getRandomPet(req, res)
);

router.post(
  "/add", // POST /api/pets/add
  (req, res) => petController.addPet(req, res)
);

export default router;
