import { Request, Response, NextFunction } from 'express';
import { PetService, CreatePetDto, UpdatePetDto } from '../../../application/pet.service';

// UUID validation regex (supports all UUID versions including UUIDv7)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

/**
 * HTTP Controller for Pet endpoints
 */
export class PetController {
  constructor(private readonly petService: PetService) {}

  /**
   * GET /api/pets - List all pets
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await this.petService.findAll(page, limit);
      res.json({ status: "OK", data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/pets/type/:type - List pets by type
   */
  findByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type } = req.params;
      if (!type || typeof type !== 'string') {
        res.status(400).json({ error: 'Invalid type' });
        return;
      }

      // Extract pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await this.petService.findByType(type, page, limit);
      res.json({ status: "OK", data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/pets/:id - Get single pet
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const pet = await this.petService.findById(id);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      res.json(pet);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/pets/search/:name - Search pets by name
   */
  searchByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.params;

      if (!name || name.trim().length === 0) {
        res.status(400).json({ error: 'Name parameter is required' });
        return;
      }

      const pets = await this.petService.findByName(name.trim());
      res.json(pets);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/pets - Create new pet (Admin only)
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreatePetDto = req.body;

      // Validate required fields
      if (!dto.name || !dto.type || !dto.breed) {
        res.status(400).json({ error: 'name, type, and breed are required' });
        return;
      }

      const pet = await this.petService.create(dto);
      res.status(201).json(pet);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/pets/:id - Update pet (Admin only)
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const dto: UpdatePetDto = req.body;

      const pet = await this.petService.update(id, dto);
      res.json(pet);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }
      next(error);
    }
  };

  /**
   * DELETE /api/admin/pets/:id - Delete pet (Admin only)
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      await this.petService.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }
      next(error);
    }
  };
}
