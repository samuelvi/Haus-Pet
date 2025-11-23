import { Router } from 'express';
import { PetController } from '../../infrastructure/http/controllers/pet.controller';
import { PetService } from '../../application/pet.service';
import { PostgresEventStoreRepository } from '../../infrastructure/eventsourcing/postgres-event-store.repository';
import prisma from '../../infrastructure/database/prisma-client';

const router = Router();

// Initialize dependencies
const eventStore = new PostgresEventStoreRepository(prisma);
const petService = new PetService(prisma, eventStore);
const petController = new PetController(petService);

/**
 * Public routes - Read operations
 */

// GET /api/pets - List all pets
router.get('/', petController.findAll);

// GET /api/pets/type/:type - List pets by type
router.get('/type/:type', petController.findByType);

// GET /api/pets/search/:name - Search pets by name
router.get('/search/:name', petController.searchByName);

// GET /api/pets/:id - Get single pet by ID
router.get('/:id', petController.findById);

export default router;
