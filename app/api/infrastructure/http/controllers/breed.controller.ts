import { Request, Response } from "express";
import { AuditLoggingBreedServiceDecorator } from "../../../application/audit-logging-breed.service.decorator";
import { BreedAlreadyExistsError } from "../../../domain/errors/breed-already-exists.error";
import { AnimalType } from "../../../domain/breed";
import { BreedFilters } from "../../../domain/breed-read.repository";
import { breedSchema, breedIdSchema } from "../validators/breed.validator";
import { z } from "zod";

export class BreedController {
  constructor(private readonly breedService: AuditLoggingBreedServiceDecorator) {}

  public async getAllBreeds(req: Request, res: Response): Promise<void> {
    try {
      const filters: BreedFilters = {};

      // Extract query parameters
      if (req.query.type && typeof req.query.type === 'string') {
        const type = req.query.type.toLowerCase();
        if (Object.values(AnimalType).includes(type as AnimalType)) {
          filters.type = type as AnimalType;
        }
      }

      if (req.query.search && typeof req.query.search === 'string') {
        filters.search = req.query.search.trim();
      }

      const breeds = await this.breedService.getAllBreeds(req.auditContext!, filters);
      res.status(200).json({ status: "OK", data: breeds });
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching breeds" });
    }
  }

  public async getBreedsByType(req: Request, res: Response): Promise<void> {
    const type = req.params.type as AnimalType;
    try {
      const breeds = await this.breedService.getBreedsByType(type, req.auditContext!);
      res.status(200).json({ status: "OK", data: breeds });
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: `Error fetching ${type} breeds` });
    }
  }

  public async getRandomBreed(req: Request, res: Response): Promise<void> {
    try {
      const breed = await this.breedService.getRandomBreed(req.auditContext!);
      if (breed) {
        res.status(200).json({ status: "OK", data: breed });
      } else {
        res.status(404).json({ status: "ERROR", message: "No breeds found" });
      }
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching random breed" });
    }
  }

  public async getRandomBreedByType(req: Request, res: Response): Promise<void> {
    const type = req.params.type as AnimalType;
    try {
      const breed = await this.breedService.getRandomBreedByType(type, req.auditContext!);
      if (breed) {
        res.status(200).json({ status: "OK", data: breed });
      } else {
        res.status(404).json({ status: "ERROR", message: `No ${type} breeds found` });
      }
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: `Error fetching random ${type} breed` });
    }
  }

  public async addBreed(req: Request, res: Response): Promise<void> {
    try {
      // Validate input with Zod
      const validation = breedSchema.safeParse(req.body);
      if (!validation.success) {
        const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        res.status(400).json({ status: "ERROR", message: `Validation failed: ${errors}` });
        return;
      }

      const { name, animalType } = validation.data;
      const newBreed = await this.breedService.addBreed(name, animalType, req.auditContext!);
      res.status(201).json({ status: "OK", data: { message: "Breed added successfully", breed: newBreed } });
    } catch (error: any) {
      if (error instanceof BreedAlreadyExistsError) {
        res.status(409).json({ status: "ERROR", message: error.message }); // 409 Conflict
      } else {
        res.status(500).json({ status: "ERROR", message: "Error adding breed" });
      }
    }
  }

  public async addBreedToType(req: Request, res: Response): Promise<void> {
    const type = req.params.type as AnimalType;
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        res.status(400).json({ status: "ERROR", message: "Invalid input: 'name' must be a non-empty string" });
        return;
      }

      const newBreed = await this.breedService.addBreed(name, type, req.auditContext!);
      res.status(201).json({ status: "OK", data: { message: `${type} breed added successfully`, breed: newBreed } });
    } catch (error: any) {
      if (error instanceof BreedAlreadyExistsError) {
        res.status(409).json({ status: "ERROR", message: error.message }); // 409 Conflict
      } else {
        res.status(500).json({ status: "ERROR", message: `Error adding ${type} breed` });
      }
    }
  }

  public async getBreedById(req: Request, res: Response): Promise<void> {
    try {
      // Validate ID parameter
      const validation = breedIdSchema.safeParse(req.params);
      if (!validation.success) {
        res.status(400).json({ status: "ERROR", message: "Invalid breed ID: must be a valid UUID" });
        return;
      }

      const { id } = validation.data;
      const breed = await this.breedService.getBreedById(id, req.auditContext!);
      if (breed) {
        res.status(200).json({ status: "OK", data: breed });
      } else {
        res.status(404).json({ status: "ERROR", message: "Breed not found" });
      }
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching breed" });
    }
  }

  public async updateBreed(req: Request, res: Response): Promise<void> {
    try {
      // Validate ID parameter
      const idValidation = breedIdSchema.safeParse(req.params);
      if (!idValidation.success) {
        res.status(400).json({ status: "ERROR", message: "Invalid breed ID: must be a valid UUID" });
        return;
      }

      // Validate body
      const bodyValidation = breedSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        const errors = bodyValidation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        res.status(400).json({ status: "ERROR", message: `Validation failed: ${errors}` });
        return;
      }

      const { id } = idValidation.data;
      const { name, animalType } = bodyValidation.data;

      const updatedBreed = await this.breedService.updateBreed(id, name, animalType, req.auditContext!);
      res.status(200).json({ status: "OK", data: { message: "Breed updated successfully", breed: updatedBreed } });
    } catch (error: any) {
      if (error.message === "Breed not found") {
        res.status(404).json({ status: "ERROR", message: error.message });
      } else if (error instanceof BreedAlreadyExistsError) {
        res.status(409).json({ status: "ERROR", message: error.message });
      } else {
        res.status(500).json({ status: "ERROR", message: "Error updating breed" });
      }
    }
  }

  public async deleteBreed(req: Request, res: Response): Promise<void> {
    try {
      // Validate ID parameter
      const validation = breedIdSchema.safeParse(req.params);
      if (!validation.success) {
        res.status(400).json({ status: "ERROR", message: "Invalid breed ID: must be a valid UUID" });
        return;
      }

      const { id } = validation.data;
      await this.breedService.deleteBreed(id, req.auditContext!);
      res.status(200).json({ status: "OK", data: { message: "Breed deleted successfully" } });
    } catch (error: any) {
      if (error.message === "Breed not found") {
        res.status(404).json({ status: "ERROR", message: error.message });
      } else {
        res.status(500).json({ status: "ERROR", message: "Error deleting breed" });
      }
    }
  }
}
