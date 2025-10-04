import { Router } from "express";
import { CatController } from "../infrastructure/http/controllers/cat.controller";
import { CatService } from "../application/cat.service";
import { createCatRepository } from "../infrastructure/repositories/repository.factory";
import { AuditService } from "../application/audit.service";
import { PostgresAuditRepository } from "../infrastructure/repositories/postgres-audit.repository";
import { AuditLoggingCatServiceDecorator } from "../application/audit-logging-cat.service.decorator";
import { pool } from "../infrastructure/database/postgres-pool";
import { QueueService } from "../infrastructure/queue/queue.service";
import { RedisHealthService } from "../infrastructure/queue/redis-health.service";
import redisConnection from "../infrastructure/queue/redis-connection";

const router = Router();

// --- Dependency Injection / Composition Root ---

// 1. Create Cat infrastructure
const catRepository = createCatRepository();
const realCatService = new CatService(catRepository);

// 2. Create Audit infrastructure (for synchronous fallback)
const auditRepository = new PostgresAuditRepository(pool);
const auditService = new AuditService(auditRepository);

// 3. Create Queue and Health Check infrastructure
const queueService = new QueueService();
const redisHealthService = new RedisHealthService(redisConnection);

// 4. Decorate the real CatService with asynchronous auditing functionality
const decoratedCatService = new AuditLoggingCatServiceDecorator(
  realCatService,
  auditService, // Injected for the sync fallback
  queueService, // Injected for async publishing
  redisHealthService // Injected for the circuit breaker
);

// 5. Inject the fully decorated service into the controller
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
