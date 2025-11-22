import { Request, Response, NextFunction } from 'express';
import { AnimalService, CreateAnimalDto, UpdateAnimalDto } from '../../../application/animal.service';
import { AnimalType } from '@prisma/client';

// UUID validation regex (supports all UUID versions including UUIDv7)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

/**
 * HTTP Controller for Animal endpoints
 */
export class AnimalController {
  constructor(private readonly animalService: AnimalService) {}

  /**
   * GET /api/animals - List all animals
   */
  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const animals = await this.animalService.findAll();
      res.json(animals);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/animals/type/:type - List animals by type
   */
  findByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type } = req.params;
      const validTypes: AnimalType[] = ['cat', 'dog', 'bird'];

      if (!validTypes.includes(type as AnimalType)) {
        res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        return;
      }

      const animals = await this.animalService.findByType(type as AnimalType);
      res.json(animals);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/animals/:id - Get single animal
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const animal = await this.animalService.findById(id);

      if (!animal) {
        res.status(404).json({ error: 'Animal not found' });
        return;
      }

      res.json(animal);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/animals/search/:name - Search animals by name
   */
  searchByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.params;

      if (!name || name.trim().length === 0) {
        res.status(400).json({ error: 'Name parameter is required' });
        return;
      }

      const animals = await this.animalService.findByName(name.trim());
      res.json(animals);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/animals - Create new animal (Admin only)
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreateAnimalDto = req.body;

      // Validate required fields
      if (!dto.name || !dto.type || !dto.breed) {
        res.status(400).json({ error: 'name, type, and breed are required' });
        return;
      }

      const validTypes = ['cat', 'dog', 'bird'];
      if (!validTypes.includes(dto.type)) {
        res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        return;
      }

      const animal = await this.animalService.create(dto);
      res.status(201).json(animal);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/animals/:id - Update animal (Admin only)
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const dto: UpdateAnimalDto = req.body;

      if (dto.type) {
        const validTypes = ['cat', 'dog', 'bird'];
        if (!validTypes.includes(dto.type)) {
          res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
          return;
        }
      }

      const animal = await this.animalService.update(id, dto);
      res.json(animal);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: 'Animal not found' });
        return;
      }
      next(error);
    }
  };

  /**
   * DELETE /api/admin/animals/:id - Delete animal (Admin only)
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      await this.animalService.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: 'Animal not found' });
        return;
      }
      next(error);
    }
  };
}
