import { Router } from 'express';
import { AnimalController } from '../../infrastructure/http/controllers/animal.controller';
import { AnimalService } from '../../application/animal.service';
import { PostgresEventStoreRepository } from '../../infrastructure/eventsourcing/postgres-event-store.repository';
import prisma from '../../infrastructure/database/prisma-client';

const router = Router();

// Initialize dependencies
const eventStore = new PostgresEventStoreRepository(prisma);
const animalService = new AnimalService(prisma, eventStore);
const animalController = new AnimalController(animalService);

/**
 * Public routes - Read operations
 */

// GET /api/animals - List all animals
router.get('/', animalController.findAll);

// GET /api/animals/type/:type - List animals by type
router.get('/type/:type', animalController.findByType);

// GET /api/animals/search/:name - Search animals by name
router.get('/search/:name', animalController.searchByName);

// GET /api/animals/:id - Get single animal by ID
router.get('/:id', animalController.findById);

export default router;
