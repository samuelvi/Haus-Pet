import { Request, Response, NextFunction } from 'express';
import { SponsorshipService, CreateSponsorshipDto } from '../../../application/sponsorship.service';

/**
 * HTTP Controller for Sponsorship endpoints
 */
export class SponsorshipController {
  constructor(private readonly sponsorshipService: SponsorshipService) {}

  /**
   * POST /api/sponsorships - Create a new sponsorship
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreateSponsorshipDto = req.body;

      // Validate required fields
      if (!dto.animalId || !dto.email || !dto.name || !dto.amount) {
        res.status(400).json({ error: 'animalId, email, name, and amount are required' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      // Validate amount
      if (typeof dto.amount !== 'number' || dto.amount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number' });
        return;
      }

      const sponsorship = await this.sponsorshipService.create(dto);
      res.status(201).json(sponsorship);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Animal with id')) {
          res.status(404).json({ error: 'Animal not found' });
          return;
        }
        if (error.message.includes('deleted animal')) {
          res.status(400).json({ error: 'Cannot sponsor a deleted animal' });
          return;
        }
      }
      next(error);
    }
  };

  /**
   * GET /api/sponsorships/animal/:animalId - Get sponsorships for an animal
   */
  findByAnimal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { animalId } = req.params;
      const sponsorships = await this.sponsorshipService.findByAnimal(animalId);
      res.json(sponsorships);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/sponsorships/recent - Get recent sponsorships
   */
  findRecent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedLimit = parseInt(req.query.limit as string, 10);
      // Validate limit: must be positive and max 100
      const limit = isNaN(parsedLimit) ? 10 : Math.min(Math.max(1, parsedLimit), 100);
      const sponsorships = await this.sponsorshipService.findRecent(limit);
      res.json(sponsorships);
    } catch (error) {
      next(error);
    }
  };
}
