import { Router } from "express";
import { CatController } from "../../infrastructure/http/controllers/cat.controller";
import { CatService } from "../../application/cat.service";
import { createCatRepository } from "../../infrastructure/repositories/repository.factory";
import { AuditService } from "../../application/audit.service";
import { MongoAuditRepository } from "../../infrastructure/repositories/mongo-audit.repository";
import { AuditLoggingCatServiceDecorator } from "../../application/audit-logging-cat.service.decorator";
import mongoClient from "../../infrastructure/database/mongo-client";
import { QueueService } from "../../infrastructure/queue/queue.service";
import { RedisHealthService } from "../../infrastructure/queue/redis-health.service";
import redisConnection from "../../infrastructure/queue/redis-connection";

const router = Router();

// --- Dependency Injection / Composition Root ---

// 1. Create Cat repository (implements both read and write interfaces)
const catRepository = createCatRepository();

// 2. Inject the repository for both read and write operations into the service
const realCatService = new CatService(catRepository, catRepository);

// 3. Create Audit infrastructure
const auditRepository = new MongoAuditRepository(mongoClient);
const auditService = new AuditService(auditRepository);

// 4. Create Queue and Health Check infrastructure
const queueService = new QueueService();
const redisHealthService = new RedisHealthService(redisConnection);

// 5. Decorate the real CatService with auditing functionality
const decoratedCatService = new AuditLoggingCatServiceDecorator(
  realCatService,
  auditService,
  queueService,
  redisHealthService
);

// 6. Inject the fully decorated service into the controller
const catController = new CatController(decoratedCatService);

// --- Define the routes ---
router.get(
  "/", // GET /api/cats/
  (req, res) => catController.getAllBreeds(req, res)
);

router.get(
  "/random-cat", // GET /api/cats/random-cat
  (req, res) => catController.getRandomBreed(req, res)
);

router.post(
  "/add", // POST /api/cats/add
  (req, res) => catController.addBreed(req, res)
);

export default router;
