import { Router } from 'express';
import { SponsorshipController } from '../../infrastructure/http/controllers/sponsorship.controller';
import { SponsorshipService } from '../../application/sponsorship.service';
import { PostgresEventStoreRepository } from '../../infrastructure/eventsourcing/postgres-event-store.repository';
import prisma from '../../infrastructure/database/prisma-client';

const router = Router();

// Initialize dependencies
const eventStore = new PostgresEventStoreRepository(prisma);
const sponsorshipService = new SponsorshipService(prisma, eventStore);
const sponsorshipController = new SponsorshipController(sponsorshipService);

/**
 * Public routes for sponsorships
 */

// POST /api/sponsorships - Create a new sponsorship
router.post('/', sponsorshipController.create);

// GET /api/sponsorships/animal/:animalId - Get sponsorships for an animal
router.get('/animal/:animalId', sponsorshipController.findByAnimal);

// GET /api/sponsorships/recent - Get recent sponsorships
router.get('/recent', sponsorshipController.findRecent);

export default router;
